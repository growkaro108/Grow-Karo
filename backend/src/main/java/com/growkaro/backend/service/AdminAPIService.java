package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.DTO.UserRequest;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.FundraiserCode;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.SupportIssue;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.WithdrawalRequest;
import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;
import com.growkaro.backend.repository.FundraiserCodeRepository;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.SchemeRepository;
import com.growkaro.backend.repository.SupportIssueRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;
import com.growkaro.backend.repository.WithdrawalRequestRepository;

@Service
public class AdminAPIService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final UserRepository userRepository;
    private final RemitterRepository remitterRepository;
    private final TransactionRepository transactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final SupportIssueRepository supportIssueRepository;
    private final FundraiserCodeRepository fundraiserCodeRepository;
    private final SchemeRepository schemeRepository;
    private final UserSchemeRepository userSchemeRepository;
    private final ApiService apiService;
    private final General general;

    public AdminAPIService(UserRepository userRepository,
            RemitterRepository remitterRepository,
            TransactionRepository transactionRepository,
            WithdrawalRequestRepository withdrawalRequestRepository,
            SupportIssueRepository supportIssueRepository,
            FundraiserCodeRepository fundraiserCodeRepository,
            SchemeRepository schemeRepository, UserSchemeRepository userSchemeRepository, @Lazy ApiService apiService,
            General general) {
        this.userRepository = userRepository;
        this.remitterRepository = remitterRepository;
        this.transactionRepository = transactionRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.supportIssueRepository = supportIssueRepository;
        this.fundraiserCodeRepository = fundraiserCodeRepository;
        this.schemeRepository = schemeRepository;
        this.userSchemeRepository = userSchemeRepository;
        this.apiService = apiService;
        this.general = general;
    }

    // create a new scheme
    @CacheEvict(value = "allSchemes", allEntries = true)
    public Scheme createScheme(ReceiveSchemeData schemeData) {
        Scheme scheme = general.toScheme(schemeData);
        try {
            return schemeRepository.save(scheme);
        } catch (Exception e) {
            throw new RuntimeException("Error in creating scheme", e);
        }
    }

    public List<SchemeResponse> getAllSchemes() {
        return schemeRepository.findAll().stream()
                // filter which is closed(status: false)
                .filter(scheme -> Boolean.TRUE.equals(scheme.getStatus()))
                .map(general::toSchemeResponse)
                .toList();
    }

    // Update the scheme
    @CacheEvict(value = "allSchemes", allEntries = true)
    public Scheme updateScheme(String id, ReceiveSchemeData receiveData) {
        if (id == null || id.isBlank() || receiveData == null) {
            return null;
        }

        try {
            Scheme existingSchemeData = schemeRepository.findById(id).orElse(null);
            if (existingSchemeData == null) {
                return null;
            }

            general.applyIfChanged(receiveData.schemeName(), existingSchemeData.getSchemeName(),
                    existingSchemeData::setSchemeName);
            general.applyIfChanged(receiveData.schemeCategory(), existingSchemeData.getSchemeCategory(),
                    existingSchemeData::setSchemeCategory);
            general.applyIfChanged(receiveData.schemeDetails(), existingSchemeData.getSchemeDetails(),
                    existingSchemeData::setSchemeDetails);
            general.applyIfChanged(receiveData.payoutFrequency(), existingSchemeData.getPayoutFrequency(),
                    existingSchemeData::setPayoutFrequency);
            general.applyIfChanged(receiveData.tenure(), existingSchemeData.getTenure(), existingSchemeData::setTenure);
            general.applyIfChanged(receiveData.maturityValue(), existingSchemeData.getMaturityValue(),
                    existingSchemeData::setMaturityValue);
            general.applyIfChanged(receiveData.profitPercentage(), existingSchemeData.getProfitPercentage(),
                    existingSchemeData::setProfitPercentage);
            general.applyIfChanged(receiveData.status(), existingSchemeData.getStatus(), existingSchemeData::setStatus);
            general.applyIfChanged(receiveData.startDate(), existingSchemeData.getStartDate(),
                    existingSchemeData::setStartDate);
            general.applyIfChanged(receiveData.endDate(), existingSchemeData.getEndDate(),
                    existingSchemeData::setEndDate);
            general.applyIfChanged(receiveData.investmentAmount(), existingSchemeData.getInvestmentAmount(),
                    existingSchemeData::setInvestmentAmount);
            general.applyIfChanged(receiveData.maxInvestorsAllowed(), existingSchemeData.getMaxInvestorsAllowed(),
                    existingSchemeData::setMaxInvestorsAllowed);

            return schemeRepository.save(existingSchemeData);
        } catch (Exception e) {
            return null;
        }
    }

    @CacheEvict(value = "allSchemes", allEntries = true)
    public boolean removeScheme(String id) {
        try {
            schemeRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, Object> getAllUsersRequests() {
        try {
            List<UserRequest> userSchemes = userSchemeRepository.findAllWithUserAndScheme();
            return general.response("success", "All user requests", userSchemes);
        } catch (Exception e) {
            e.printStackTrace();
            return general.response("error", "Error in getting user requests", null);
        }
    }

    public Map<String, Object> approveUserScheme(String userSchemeId, String userId, Long paidAmount) {
        try {
            UserScheme userScheme = userSchemeRepository.findById(userSchemeId).orElse(null);
            if (userScheme == null) {
                return general.response("error", "User scheme not found", null);
            }
            userScheme.setStatus(UserScheme.UserSchemeStatus.ACTIVE);
            return apiService.userSchemeStatusUpdate(userSchemeId, userId, UserSchemeStatus.ACTIVE,
                    UserSchemeStatus.PENDING, userScheme);
        } catch (Exception e) {
            return general.response("error", "Error in approving user scheme", null);
        }
    }

    public Map<String, Object> rejectUserScheme(String userSchemeId, String userId) {
        try {
            return apiService.userSchemeStatusUpdate(userSchemeId, userId, UserSchemeStatus.REJECTED,
                    UserSchemeStatus.PENDING, null);
        } catch (Exception e) {
            return general.response("error", "Error in rejecting user scheme", null);
        }
    }

    @Cacheable(value = "adminDashboard", key = "#range ?: 'default'")
    @Transactional(readOnly = true)
    public Map<String, Object> adminDashboard(String range) {
        Page<WithdrawalRequest> withdrawals = withdrawalRequestRepository.findAllByOrderByCreatedAtDesc(pageable("1"));
        Page<SupportIssue> issues = supportIssueRepository.findAll(pageable("1"));
        Page<FundraiserCode> codes = fundraiserCodeRepository.findAll(pageable("1"));
        Page<User> users = userRepository.findAll(pageable("1"));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("range", range);
        data.put("summary", Map.of(
                "totalUsers", userRepository.count(),
                "activeUsers", userRepository.countByActive(true),
                "activeRemitters", remitterRepository.countActive(),
                "pendingRemitters", remitterRepository.countPending(),
                "pendingWithdrawals", withdrawalRequestRepository.countByStatus(WithdrawalRequest.Status.PENDING),
                "openIssues", supportIssueRepository.countOpenIssues(),
                "successfulVolume", transactionRepository.sumSuccessfulAmountBetween(LocalDateTime.now().minusDays(30),
                        LocalDateTime.now())));
        data.put("inflowData", inflowData());
        data.put("withdrawals", withdrawals.getContent().stream().map(this::toWithdrawalView).toList());
        data.put("issues", issues.getContent().stream().map(this::toIssueView).toList());
        data.put("codes", codes.getContent().stream().map(this::toFundraiserCodeView).toList());
        data.put("eventTemplates", eventTemplates());
        data.put("names", users.getContent().stream().map(User::getName).toList());
        return general.response("ok", "Admin dashboard data fetched", data);
    }

    @Cacheable(value = "withdrawals", key = "#status ?: 'default'")
    @Transactional(readOnly = true)
    public Map<String, Object> withdrawals(String status) {
        Page<WithdrawalRequest> page = parseWithdrawalStatus(status)
                .map(value -> withdrawalRequestRepository.findByStatus(value, pageable("1")))
                .orElseGet(() -> withdrawalRequestRepository.findAllByOrderByCreatedAtDesc(pageable("1")));

        Map<String, Object> data = paginatedMeta(page);
        data.put("status", status);
        data.put("items", page.getContent().stream().map(this::toWithdrawalView).toList());
        return general.response("ok", "Withdrawal requests fetched", data);
    }

    @CacheEvict(value = { "adminDashboard", "withdrawals" }, allEntries = true)
    @Transactional
    public Map<String, Object> updateWithdrawal(String withdrawalId, Map<String, Object> payload) {
        Optional<WithdrawalRequest> withdrawalOpt = withdrawalRequestRepository.findById(withdrawalId);
        if (withdrawalOpt.isEmpty()) {
            return general.response("error", "Withdrawal not found", Map.of("id", withdrawalId));
        }

        WithdrawalRequest withdrawal = withdrawalOpt.get();
        parseWithdrawalStatus(stringValue(payload.get("status"))).ifPresent(withdrawal::setStatus);
        if (payload.containsKey("adminNote")) {
            withdrawal.setAdminNote(stringValue(payload.get("adminNote")));
        }
        if (payload.containsKey("proofUrl")) {
            withdrawal.setProofUrl(stringValue(payload.get("proofUrl")));
        }
        return general.response("ok", "Withdrawal updated",
                toWithdrawalView(withdrawalRequestRepository.save(withdrawal)));
    }

    @Cacheable(value = "issues", key = "#status ?: 'default'")
    @Transactional(readOnly = true)
    public Map<String, Object> issues(String status) {
        Page<SupportIssue> page = parseIssueStatus(status)
                .map(value -> supportIssueRepository.findByStatus(value, pageable("1")))
                .orElseGet(() -> supportIssueRepository.findAll(pageable("1")));

        Map<String, Object> data = paginatedMeta(page);
        data.put("status", status);
        data.put("items", page.getContent().stream().map(this::toIssueView).toList());
        return general.response("ok", "Issues fetched", data);
    }

    @CacheEvict(value = { "adminDashboard", "issues" }, allEntries = true)
    @Transactional
    public Map<String, Object> resolveIssue(String issueId) {
        Optional<SupportIssue> issueOpt = supportIssueRepository.findById(issueId);
        if (issueOpt.isEmpty()) {
            return general.response("error", "Issue not found", Map.of("id", issueId));
        }

        SupportIssue issue = issueOpt.get();
        issue.setStatus(SupportIssue.Status.RESOLVED);
        issue.setResolvedAt(LocalDateTime.now());
        return general.response("ok", "Issue resolved", toIssueView(supportIssueRepository.save(issue)));
    }

    @Cacheable(value = "remitters", key = "#page ?: 'default'")
    @Transactional(readOnly = true)
    public Map<String, Object> remitters(String page) {
        Page<Remitter> remitters = remitterRepository.findAll(pageable(page));
        Map<String, Object> data = paginatedMeta(remitters);
        data.put("items", remitters.getContent().stream().map(this::toRemitterView).toList());
        return general.response("ok", "Remitters fetched", data);
    }

    @CacheEvict(value = { "adminDashboard", "remitters" }, allEntries = true)
    @Transactional
    public Map<String, Object> createRemitter(Map<String, Object> payload) {
        String email = firstString(payload, "remitterEmail", "email");
        String phone = firstString(payload, "remitterPhone", "phone");
        String name = firstString(payload, "remitterName", "name", "organizationName");

        if (email == null || phone == null || name == null) {
            return general.response("error", "remitterName, remitterEmail, and remitterPhone are required", Map.of());
        }
        if (userRepository.existsByEmail(email) || userRepository.existsByPhone(phone)) {
            return general.response("error", "Remitter user already exists", Map.of("email", email, "phone", phone));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(firstString(payload, "password", "passwordHash") != null
                ? firstString(payload, "password", "passwordHash")
                : "ChangeMe@123");
        user.setRole(User.Role.REMITTER);
        user = userRepository.save(user);

        Remitter remitter = new Remitter();
        remitter.setUser(user);
        remitter.setOrganizationName(name);
        remitter.setPanNumber(firstString(payload, "panNumber"));
        remitter.setGstNumber(firstString(payload, "gstNumber"));
        remitter.setStatus(Remitter.Status.ACTIVE);
        remitter = remitterRepository.save(remitter);

        String trackerCode = firstString(payload, "trackerCode", "code");
        if (trackerCode != null) {
            FundraiserCode code = new FundraiserCode();
            code.setRemitter(remitter);
            code.setCode(trackerCode);
            code.setDescription("Default tracker for " + name);
            code.setUsageLimit(intValue(payload.get("allocationLimit"), 1));
            fundraiserCodeRepository.save(code);
        }

        return general.response("ok", "Remitter created", toRemitterView(remitter));
    }

    @Cacheable(value = "fundraiserCodes", key = "#page ?: 'default'")
    @Transactional(readOnly = true)
    public Map<String, Object> fundraiserCodes(String page) {
        Page<FundraiserCode> codes = fundraiserCodeRepository.findAll(pageable(page));
        Map<String, Object> data = paginatedMeta(codes);
        data.put("items", codes.getContent().stream().map(this::toFundraiserCodeView).toList());
        return general.response("ok", "Fundraiser codes fetched", data);
    }

    @CacheEvict(value = { "adminDashboard", "fundraiserCodes" }, allEntries = true)
    @Transactional
    public Map<String, Object> createFundraiserCode(Map<String, Object> payload) {
        String codeValue = firstString(payload, "code", "trackerCode");
        String remitterId = firstString(payload, "remitterId");
        if (codeValue == null || remitterId == null) {
            return general.response("error", "code and remitterId are required", Map.of());
        }
        if (fundraiserCodeRepository.existsByCode(codeValue)) {
            return general.response("error", "Fundraiser code already exists", Map.of("code", codeValue));
        }

        Optional<Remitter> remitterOpt = remitterRepository.findById(remitterId);
        if (remitterOpt.isEmpty()) {
            return general.response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }

        FundraiserCode code = new FundraiserCode();
        code.setRemitter(remitterOpt.get());
        code.setCode(codeValue);
        code.setDescription(firstString(payload, "description"));
        code.setUsageLimit(intValue(payload.get("usageLimit"), 1));
        return general.response("ok", "Fundraiser code created",
                toFundraiserCodeView(fundraiserCodeRepository.save(code)));
    }

    private List<Map<String, Object>> inflowData() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        return java.util.stream.IntStream.rangeClosed(0, 13)
                .mapToObj(daysAgo -> {
                    LocalDateTime day = now.minusDays(13L - daysAgo);
                    LocalDateTime start = day.toLocalDate().atStartOfDay();
                    LocalDateTime end = start.plusDays(1).minusNanos(1);
                    return Map.<String, Object>of(
                            "day", formatter.format(day),
                            "amount", transactionRepository.sumSuccessfulAmountBetween(start, end));
                })
                .toList();
    }

    private List<Map<String, Object>> eventTemplates() {
        return List.of(
                Map.of("type", "deposit", "text", "deposited", "amountRange", List.of(5000, 60000)),
                Map.of("type", "withdrawal", "text", "requested a withdrawal of", "amountRange", List.of(3000, 40000)),
                Map.of("type", "signup", "text", "created a new account"),
                Map.of("type", "kyc", "text", "completed KYC verification"),
                Map.of("type", "referral", "text", "joined via fundraiser code"));
    }

    private Map<String, Object> toWithdrawalView(WithdrawalRequest withdrawal) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", withdrawal.getId());
        data.put("user", withdrawal.getUser().getName());
        data.put("email", withdrawal.getUser().getEmail());
        data.put("amount", withdrawal.getAmount());
        data.put("method", withdrawal.getRecipient().getUpiId() != null ? "UPI" : "Bank Transfer");
        data.put("requestedAt", withdrawal.getCreatedAt());
        data.put("status", withdrawal.getStatus().name().toLowerCase());
        data.put("adminNote", withdrawal.getAdminNote());
        data.put("proofUrl", withdrawal.getProofUrl());
        return data;
    }

    private Map<String, Object> toIssueView(SupportIssue issue) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", issue.getId());
        data.put("user", issue.getUser().getName());
        data.put("subject", issue.getTitle());
        data.put("title", issue.getTitle());
        data.put("message", issue.getDescription());
        data.put("priority", issue.getPriority().name().toLowerCase());
        data.put("status", issue.getStatus().name().toLowerCase());
        data.put("createdAt", issue.getCreatedAt());
        data.put("resolvedAt", issue.getResolvedAt());
        return data;
    }

    private Map<String, Object> toFundraiserCodeView(FundraiserCode code) {
        BigDecimal raised = code.getRemitter() != null
                ? transactionRepository.sumSuccessfulAmountByRemitter(code.getRemitter().getId())
                : BigDecimal.ZERO;
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", code.getId());
        data.put("code", code.getCode());
        data.put("owner", code.getRemitter().getOrganizationName());
        data.put("raised", raised);
        data.put("goal", code.getUsageLimit());
        data.put("referrals", code.getUsageCount());
        data.put("status", code.isActive() ? "active" : "paused");
        data.put("description", code.getDescription());
        data.put("expiresAt", code.getExpiresAt());
        return data;
    }

    private Map<String, Object> toRemitterView(Remitter remitter) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", remitter.getId());
        data.put("name", remitter.getOrganizationName());
        data.put("organizationName", remitter.getOrganizationName());
        data.put("email", remitter.getUser().getEmail());
        data.put("phone", remitter.getUser().getPhone());
        data.put("gstNumber", remitter.getGstNumber());
        data.put("panNumber", remitter.getPanNumber());
        data.put("status", remitter.getStatus().name().toLowerCase());
        data.put("createdAt", remitter.getCreatedAt());
        return data;
    }

    private Map<String, Object> paginatedMeta(Page<?> page) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("currentPage", page.getNumber() + 1);
        data.put("totalPages", page.getTotalPages());
        data.put("totalItems", page.getTotalElements());
        return data;
    }

    private Pageable pageable(String page) {
        int safePage = 1;
        try {
            if (page != null && !page.isBlank()) {
                safePage = Integer.parseInt(page);
            }
        } catch (NumberFormatException ignored) {
            safePage = 1;
        }
        return PageRequest.of(Math.max(safePage, 1) - 1, DEFAULT_PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private Optional<WithdrawalRequest.Status> parseWithdrawalStatus(String status) {
        try {
            return status == null || status.isBlank()
                    ? Optional.empty()
                    : Optional.of(WithdrawalRequest.Status.valueOf(status.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private Optional<SupportIssue.Status> parseIssueStatus(String status) {
        try {
            return status == null || status.isBlank()
                    ? Optional.empty()
                    : Optional.of(SupportIssue.Status.valueOf(status.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private String firstString(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            String value = stringValue(payload.get(key));
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private int intValue(Object value, int fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Math.max(1, new BigDecimal(value.toString()).intValue());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}
