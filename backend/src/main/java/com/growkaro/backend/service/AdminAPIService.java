package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.history.Revisions;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.growkaro.backend.DRO.AddRemitter;
import com.growkaro.backend.DRO.ManualUserScheme;
import com.growkaro.backend.DRO.NewNominee;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DRO.UserSchemeLedgerUpdateRequest;
import com.growkaro.backend.DRO.UserSchemeProfitLedgerRequest;
import com.growkaro.backend.DRO.UserSchemeReedemLedgerRequest;
import com.growkaro.backend.DTO.AddedRemitter;
import com.growkaro.backend.DTO.AdminTransactionResponse;
import com.growkaro.backend.DTO.AdminUser;
import com.growkaro.backend.DTO.IssueResponse;
import com.growkaro.backend.DTO.NomineeResponse;
import com.growkaro.backend.DTO.PagedResponse;
import com.growkaro.backend.DTO.RemitterResponse;
import com.growkaro.backend.DTO.SchemeAuditProjection;
import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.DTO.SchemeUpdateHistory;
import com.growkaro.backend.DTO.SearchUser;
import com.growkaro.backend.DTO.UserRequest;
import com.growkaro.backend.DTO.UserSchemeResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.common.GlobalExceptionHandler.DuplicateResourceException;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.Reply;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.SupportIssue;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.entity.Nominee;
import com.growkaro.backend.entity.Notification.ReceiverType;
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.entity.SupportIssue.Status;
import com.growkaro.backend.entity.Transaction.TransactionStatus;
import com.growkaro.backend.entity.Transaction.TransactionType;
import com.growkaro.backend.entity.User.Role;
import com.growkaro.backend.entity.UserSchemeReedemLedger.ReedeemStatus;
import com.growkaro.backend.enums.ActivityType;
import com.growkaro.backend.enums.UserSchemeStatus;
import com.growkaro.backend.enums.WithdrawalStatus;
import com.growkaro.backend.repository.ActivityLogRepository;
import com.growkaro.backend.repository.NotificationRepository;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.SchemeRepository;
import com.growkaro.backend.repository.SupportIssueRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAPIService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final UserRepository userRepository;
    private final RemitterRepository remitterRepository;
    private final TransactionRepository transactionRepository;
    private final SupportIssueRepository supportIssueRepository;
    private final SchemeRepository schemeRepository;
    private final UserSchemeRepository userSchemeRepository;
    private final ApiService apiService;
    private final ActivityLogService activityLogService;
    private final LocalFileStorageService localFileStorageService;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationRepository notificationRepository;
    private final General general;
    private final CrucialNotificationService crucialNotificationService;
    private final EmailService emailService;
    private final TransactionService transactionService;
    @PersistenceContext
    private EntityManager entityManager;

    // create a new scheme
    @Caching(evict = {
            @CacheEvict(value = "allSchemes", allEntries = true),
            @CacheEvict(value = "schemeAudit", allEntries = true),
    })
    public boolean createScheme(ReceiveSchemeData schemeData) {
        Scheme scheme = general.toScheme(schemeData);
        try {
            schemeRepository.save(scheme);
            // notify all user and admin by notification
            // List<String> userEmails = userRepository.findEmailOfUsersWantSchemeAlerts();
            // emailService.notifyAllUsers(userEmails, scheme); //some email issue
            return true;
        } catch (Exception e) {
            log.error("error in creating scheme because of {}", e.getMessage(), e);
            return false;
        }
    }

    public List<SchemeResponse> getAllSchemes(boolean admin) {
        return schemeRepository.findAll().stream()
                // .filter(scheme -> admin || Boolean.TRUE.equals(scheme.getStatus()))
                // Sort by startDate in DEScending order (nulls placed last to avoid
                // NullPointerException)

                .sorted(Comparator.comparing(Scheme::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(SchemeResponse::fromEntity)
                .toList();
    }

    // Update the scheme
    @Caching(evict = {
            @CacheEvict(value = "allSchemes", allEntries = true),
            @CacheEvict(value = "schemeAudit", allEntries = true),
            @CacheEvict(value = "schemeUpdateHistory", key = "#id")
    })
    public List<SchemeResponse> updateScheme(String id, ReceiveSchemeData receiveData) {
        if (id == null || id.isBlank() || receiveData == null) {
            return null;
        }

        try {
            Scheme existingSchemeData = schemeRepository.findById(id).orElse(null);
            if (existingSchemeData == null) {
                return null;
            }
            general.applyIfChanged(receiveData.schemeName(),
                    existingSchemeData.getSchemeName(),
                    existingSchemeData::setSchemeName);
            general.applyIfChanged(receiveData.schemeCategory(),
                    existingSchemeData.getSchemeCategory(),
                    existingSchemeData::setSchemeCategory);
            general.applyIfChanged(receiveData.schemeDetails(),
                    existingSchemeData.getSchemeDetails(),
                    existingSchemeData::setSchemeDetails);
            general.applyIfChanged(receiveData.payoutFrequency(),
                    existingSchemeData.getPayoutFrequency(),
                    existingSchemeData::setPayoutFrequency);
            general.applyIfChanged(receiveData.tenure(), existingSchemeData.getTenure(),
                    existingSchemeData::setTenure);
            general.applyIfChanged(receiveData.profitPercentage(),
                    existingSchemeData.getProfitPercentage(),
                    existingSchemeData::setProfitPercentage);
            general.applyIfChanged(receiveData.status(), existingSchemeData.getStatus(),
                    existingSchemeData::setStatus);
            general.applyIfChanged(receiveData.startDate(),
                    existingSchemeData.getStartDate(),
                    existingSchemeData::setStartDate);
            general.applyIfChanged(receiveData.endDate(),
                    existingSchemeData.getEndDate(),
                    existingSchemeData::setEndDate);
            general.applyIfChanged(receiveData.maxInvestorsAllowed(),
                    existingSchemeData.getMaxInvestorsAllowed(),
                    existingSchemeData::setMaxInvestorsAllowed);
            existingSchemeData.setUpdatedBy(general.adminName());

            schemeRepository.save(existingSchemeData);
            return getAllSchemes(true);
        } catch (Exception e) {
            log.error("error in updating scheme", e.getMessage());
            return null;
        }
    }

    @CacheEvict(value = "allSchemes", allEntries = true)
    public boolean removeScheme(String id) {
        try {
            schemeRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            log.error("error in removing scheme", e.getMessage());
            return false;
        }
    }

    public Map<String, Object> getAllUsersRequests() {
        try {
            List<UserRequest> userSchemes = userSchemeRepository.findAll().stream().map(general::toUserRequest)
                    .toList();
            return general.response("success", "All user requests", userSchemes);
        } catch (Exception e) {
            log.error("Error in getting user requests", e.getMessage());
            return general.response("error", "Error in getting user requests", null);
        }
    }

    @Caching(evict = {
            @CacheEvict(value = "overviewStats", key = "'adminOverview'"),
            @CacheEvict(value = "userPortfolio", key = "#p0.userId()")
    })
    @Transactional
    public Map<String, Object> addManualUserScheme(ManualUserScheme request) {
        if (request == null || request.userId() == null || request.userId().isBlank()
                || request.schemeId() == null || request.schemeId().isBlank()
                || request.nomineeId() == null || request.nomineeId().isBlank()
                || request.paidAmount() == null || request.paidAmount().signum() <= 0
                || request.paidDate() == null || request.profitLedger() == null || request.reedemLedger() == null) {
            return general.response("error", "Invalid scheme details", null);
        }

        try {
            User user = userRepository.findById(request.userId()).orElse(null);
            Scheme scheme = schemeRepository.findById(request.schemeId()).orElse(null);
            if (user == null || scheme == null) {
                return general.response("error", "User or scheme not found", null);
            }
            var nominee = user.getNominees().stream()
                    .filter(item -> request.nomineeId().equals(item.getNomineeId()))
                    .findFirst().orElse(null);
            if (nominee == null) {
                return general.response("error", "Nominee does not belong to this user", null);
            }

            UserScheme userScheme = new UserScheme();
            userScheme.setRequestDate(
                    LocalDateTime.of(request.paidDate(), LocalDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalTime()));
            userScheme.setUser(user);
            userScheme.setScheme(scheme);
            userScheme.setNominee(nominee);
            userScheme.setPaidAmount(request.paidAmount());
            userScheme.setIsApproved(true);
            userScheme.setStatus(UserSchemeStatus.ACTIVE);
            userScheme.setEnrollmentDate(
                    LocalDateTime.of(request.paidDate(), LocalDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalTime()));
            userScheme.setPaidDate(request.paidDate());
            replaceLedgers(userScheme, request.profitLedger(), request.reedemLedger());
            userScheme.setNextPayoutDate(
                    general.calculateNextPayoutDate(userScheme.getEnrollmentDate(), scheme.getPayoutFrequency(),
                            scheme.getTenure()));
            userScheme
                    .setMaturityDate(general.calculateMaturityDate(userScheme.getEnrollmentDate(), scheme.getTenure()));
            user.enrollInScheme(userScheme);
            scheme.enrollUserInScheme(userScheme);

            userSchemeRepository.save(userScheme);
            userRepository.save(user);
            schemeRepository.save(scheme);
            return general.response("success", "Scheme added to user successfully",
                    UserSchemeResponse.toUserSchemeResponse(userScheme));
        } catch (Exception e) {
            log.error("Error adding manual scheme for user {}", request.userId(), e.getCause());
            return general.response("error", "Could not add scheme to user", null);
        }
    }

    @Transactional(readOnly = true)
    public List<NomineeResponse> getUserNominees(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user == null ? List.of() : user.getNominees().stream().map(NomineeResponse::fromEntity).toList();
    }

    @Transactional
    public Map<String, Object> addUserNominee(String userId, NewNominee request) {
        if (userId == null || userId.isBlank() || request == null
                || request.name() == null || request.name().isBlank()
                || request.relation() == null || request.relation().isBlank()
                || request.aadhaarNo() == null || request.aadhaarNo().isBlank()
                || request.phone() == null || request.phone().isBlank()) {
            return general.response("error", "Invalid nominee details", null);
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return general.response("error", "User not found", null);
        }
        Nominee nominee = new Nominee();
        nominee.setUser(user);
        nominee.setName(request.name().trim());
        nominee.setRelation(request.relation().trim());
        nominee.setAadharNo(request.aadhaarNo().trim());
        nominee.setMobileNo(request.phone().trim());
        user.getNominees().add(nominee);
        userRepository.save(user);
        return general.response("success", "Nominee added successfully", NomineeResponse.fromEntity(nominee));
    }

    @CacheEvict(value = "userPortfolio", key = "#userSchemeId")
    @Transactional
    public Map<String, Object> updateUserSchemeLedger(String userSchemeId, UserSchemeLedgerUpdateRequest request) {
        if (userSchemeId == null || userSchemeId.isBlank() || request == null
                || request.profitLedger() == null || request.reedemLedger() == null) {
            return general.response("error", "Invalid ledger details", null);
        }
        UserScheme userScheme = userSchemeRepository.findById(userSchemeId).orElse(null);
        if (userScheme == null) {
            return general.response("error", "User scheme not found", null);
        }
        try {
            replaceLedgers(userScheme, request.profitLedger(), request.reedemLedger());
            userSchemeRepository.save(userScheme);
            return general.response("success", "Profit and redemption ledger updated", null);
        } catch (IllegalArgumentException e) {
            return general.response("error", e.getMessage(), null);
        }
    }

    private void replaceLedgers(UserScheme userScheme,
            List<UserSchemeProfitLedgerRequest> profits,
            List<UserSchemeReedemLedgerRequest> redeems) {
        BigDecimal totalProfit = BigDecimal.ZERO;
        BigDecimal totalRedeemed = BigDecimal.ZERO;
        userScheme.getProfitLedger().clear();
        userScheme.getReedemLedger().clear();
        for (UserSchemeProfitLedgerRequest request : profits) {
            if (request == null || request.profitAmount() == null || request.profitAmount().signum() < 0) {
                throw new IllegalArgumentException("Profit amounts cannot be negative");
            }
            UserSchemeProfitLedger entry = new UserSchemeProfitLedger();
            entry.setUserScheme(userScheme);
            entry.setProfitAmount(request.profitAmount());
            entry.setProfitDate(request.profitDate());
            userScheme.getProfitLedger().add(entry);
            totalProfit = totalProfit.add(request.profitAmount());
        }
        for (UserSchemeReedemLedgerRequest request : redeems) {
            if (request == null || request.redeemAmount() == null || request.redeemAmount().signum() < 0) {
                throw new IllegalArgumentException("Redeem amounts cannot be negative");
            }
            UserSchemeReedemLedger entry = new UserSchemeReedemLedger();
            entry.setUserScheme(userScheme);
            entry.setRedeemAmount(request.redeemAmount());
            entry.setRedeemDate(request.redeemDate());
            userScheme.getReedemLedger().add(entry);
            totalRedeemed = totalRedeemed.add(request.redeemAmount());
        }
        userScheme.setProfit(totalProfit);
        userScheme.setProfitReedemed(totalRedeemed);
        userScheme.setRedeemAmount(totalRedeemed);
        userScheme.setRedeemDate(redeems.stream().map(UserSchemeReedemLedgerRequest::redeemDate)
                .filter(java.util.Objects::nonNull).max(LocalDate::compareTo).orElse(null));
    }

    @Caching(evict = {
            @CacheEvict(value = "overviewStats", key = "'adminOverview'"),
            @CacheEvict(value = "userPortfolio", key = "#p0")
    })
    @Transactional
    public Map<String, Object> activateUsersScheme(String userId, String userSchemeId, BigDecimal paidAmount,
            LocalDate paidDate) {
        if (userSchemeId == null || userSchemeId.isBlank() || paidAmount == null
                || paidAmount.compareTo(BigDecimal.ZERO) <= 0 || paidDate == null) {
            return general.response("error", "Invalid Request", null);
        }

        UserScheme userScheme = null;
        User user = null;
        Scheme scheme = null;

        try {
            Map<String, Object> isUserSchemeValid = isUserSchemeValid(userSchemeId);
            if (isUserSchemeValid.isEmpty()) {
                log.error("error while getting user scheme for id {}", userSchemeId);
                return general.response("error", "Invaild request...", null);
            }
            userScheme = (UserScheme) isUserSchemeValid.get("userScheme");
            user = (User) isUserSchemeValid.get("user");
            scheme = (Scheme) isUserSchemeValid.get("scheme");
            // approved user
            userScheme.setIsApproved(true);

            // set paid amount and date
            userScheme.setPaidAmount(paidAmount);
            userScheme.setPaidDate(paidDate);
            userSchemeRepository.save(userScheme);
            // convert localdate to localdatetime paidDate=dateTime
            LocalDateTime settlementDate = LocalDateTime.of(paidDate,
                    LocalDateTime.now(ZoneId.of("Asia/Kolkata")).toLocalTime());

            transactionService.createDepositTransaction(userScheme, user, paidAmount, settlementDate,
                    TransactionType.DEPOSIT,
                    "Initial Deposit");
            return general.response("success",
                    user.getName() + " is approved for " + scheme.getSchemeName() + " successfully..",
                    UserSchemeResponse.toUserSchemeResponse(userScheme));

        } catch (Exception e) {
            log.error("Error activating user scheme {}", userSchemeId, e);
            return general.response("error", "Error in approving user scheme", null);
        } finally {
            if (userScheme != null && scheme != null && user != null) {
                activityLogService.log("AdminId", "Admin Name", "Admin",
                        ActivityType.SCHEME_ENROLLED,
                        user.getName() + " has approved for " + scheme.getSchemeName(), "user",
                        user.getId(), null);
            }
        }
    }

    // helper function
    private Map<String, Object> isUserSchemeValid(String id) {
        UserScheme userScheme = apiService.getUserSchemeById(id);
        if (userScheme == null)
            return Map.of();

        User user = userScheme.getUser();
        if (user == null)
            return Map.of();

        Scheme scheme = userScheme.getScheme();
        if (scheme == null)
            return Map.of();

        return Map.of("userScheme", userScheme, "user", user, "scheme", scheme);
    }

    public Map<String, Object> rejectUserScheme(String userSchemeId) {
        if (userSchemeId == null || userSchemeId.isBlank()) {
            return general.response("error", "User scheme id is required", null);
        }
        UserScheme userScheme = null;
        User user = null;
        Scheme scheme = null;

        try {
            Map<String, Object> schemeContext = isUserSchemeValid(userSchemeId);
            if (schemeContext.isEmpty()) {
                return general.response("error", "User scheme not found", null);
            }

            userScheme = (UserScheme) schemeContext.get("userScheme");
            user = (User) schemeContext.get("user");
            scheme = (Scheme) schemeContext.get("scheme");

            userSchemeRepository.deleteById(userSchemeId);
            activityLogService.log(
                    "adminId",
                    "adminName",
                    "Admin",
                    ActivityType.SCHEME_REJECTED,
                    "User: " + user.getName() + " is rejected for " + scheme.getSchemeName(),
                    "user",
                    userScheme.getUser().getId(),
                    null);

            return general.response("success", "Enrollment rejected successfully", null);
        } catch (Exception e) {
            log.error("Error rejecting user scheme {}", userSchemeId, e);
            return general.response("error", "Error in rejecting user scheme", null);
        }
    }

    @CacheEvict(value = "userPortfolio", key = "#p0")
    @Transactional
    public Map<String, Object> addBondDetails(String userSchemeId, String bondNumber, MultipartFile images,
            boolean isUpdate) {
        try {
            UserScheme userScheme = userSchemeRepository.findByUserSchemeId(userSchemeId).orElse(null);
            if (userScheme == null) {
                return general.response("error", "User scheme not found", null);
            }

            if (bondNumber != null && !bondNumber.isBlank()) {
                userScheme.setBondNumber(bondNumber.trim());
            }

            if (images != null && !images.isEmpty()) {
                String uploadedUrl = localFileStorageService.store(images, "bonds/" + userSchemeId);
                userScheme.setBondImageURL(uploadedUrl);
            }
            Scheme s = userScheme.getScheme();
            LocalDateTime todayDateTime = general.getCurrentDateTime();
            userScheme.setEnrollmentDate(todayDateTime);
            userScheme.setStatus(UserSchemeStatus.ACTIVE);
            userScheme.setNextPayoutDate(
                    general.calculateNextPayoutDate(todayDateTime, s.getPayoutFrequency(), s.getTenure()));
            userScheme.setMaturityDate(general.calculateMaturityDate(todayDateTime, s.getTenure()));
            userSchemeRepository.save(userScheme);

            return general.response("success", "Bond details added successfully...", Map.of(
                    "userSchemeId", userScheme.getUserSchemeId(),
                    "bondNumber", userScheme.getBondNumber() != null ? userScheme.getBondNumber() : "",
                    "bondImageURL", userScheme.getBondImageURL() != null ? userScheme.getBondImageURL() : ""));
        } catch (Exception e) {
            log.error("Error in adding bond details for userSchemeId={}, bondNumber={}", userSchemeId, bondNumber, e);
            return general.response("error", "Error in adding bond details", null);
        }
    }

    @Cacheable(value = "activityTypes", key = "'all'")
    public List<String> getAllStoredActivityTypes() {
        List<ActivityType> types = activityLogRepository.findDistinctTypes();
        List<String> typeNames = new ArrayList<>();
        for (ActivityType type : types) {
            typeNames.add(type.name());
        }
        return typeNames;
    }

    public PagedResponse<AdminTransactionResponse> getTransactions(
            String statusFilter, int offset, int limit) {
        int pageNumber = offset / limit; // Spring Data pages are page-index based
        Pageable pageable = PageRequest.of(pageNumber, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<TransactionStatus> rejectedStatuses = List.of(TransactionStatus.FAILED, TransactionStatus.REFUNDED,
                TransactionStatus.REJECTED);

        var page = switch (statusFilter) {
            case "pending" -> transactionRepository.findByStatus(TransactionStatus.PENDING, pageable);
            case "processed" -> transactionRepository.findByStatus(TransactionStatus.PROCESSED, pageable);
            case "approved" -> transactionRepository.findByStatus(TransactionStatus.SUCCESS, pageable);
            case "rejected" -> transactionRepository.findByStatusIn(rejectedStatuses, pageable);
            default -> transactionRepository.findAll(pageable);
        };

        var mapped = page.map(AdminTransactionResponse::fromEntity);
        return PagedResponse.from(mapped, offset, limit);
    }

    @Transactional
    public AdminTransactionResponse approve(String txnId, String remId) {
        Transaction txn = getPendingOrThrow(txnId);
        User user = txn.getUser();
        Remitter rr = remitterRepository.findByRemitterId(remId)
                .orElseThrow(() -> new RuntimeException("Remitter not found"));
        List<Transaction> remitterTransactions = rr.getTransactions() != null ? rr.getTransactions()
                : new ArrayList<>();
        remitterTransactions.add(txn);
        rr.setTransactions(remitterTransactions);
        txn.setRemitter(rr);
        txn.setStatus(TransactionStatus.PROCESSED);
        remitterRepository.save(rr);
        Transaction saved = transactionRepository.save(txn);

        try {
            crucialNotificationService.notifyAllForEssentialAction(
                    EssentialActionType.WITHDRAWAL_APPROVED,
                    user,
                    List.of(),
                    rr,
                    "/dashboard/transactions",
                    Map.of("amount", txn.getAmount() != null ? txn.getAmount().toString() : "0", "txnId", txn.getId()));
        } catch (Exception e) {
            log.error("Error notifying user for withdrawal approval because: {}", e.getMessage());
        }

        return AdminTransactionResponse.fromEntity(saved);
    }

    @Transactional
    public AdminTransactionResponse reject(String txnId, String reason) {
        Transaction txn = getPendingOrThrow(txnId);
        Transaction saved;
        try {
            txn.setStatus(TransactionStatus.REJECTED);
            txn.setFailureReason(reason != null ? reason : "Rejected by admin");
            UserScheme userScheme = txn.getUserScheme();
            userScheme.setProfitReedemed(userScheme.getProfitReedemed().subtract(txn.getAmount()));
            userSchemeRepository.save(userScheme);
            saved = transactionRepository.save(txn);
            // change status of reedem
            boolean status = general.changeReedemStatus(userScheme, txn.getAmount(), ReedeemStatus.REJECTED);
            if (!status) {
                log.error("Error in rejecting transaction: invalid reedemLedger. txnId={}, remitterId={}",
                        txnId, txn.getRemitter().getRemitterId());
                return null;
            }
        } catch (Exception e) {
            log.error("Error in rejecting transaction: {}", e.getMessage());
            return null;
        }
        try {
            crucialNotificationService.notifyUser(
                    EssentialActionType.WITHDRAWAL_REJECTED,
                    txn.getUser(),
                    "/dashboard/transactions",
                    Map.of("amount", txn.getAmount() != null ? txn.getAmount().toString() : "0", "txnId", txn.getId(),
                            "reason", reason != null ? reason : "Rejected by admin"));
        } catch (Exception e) {
            log.error("Error notifying user for withdrawal rejection because: {}", e.getMessage());
        }

        return AdminTransactionResponse.fromEntity(saved);
    }

    private Transaction getPendingOrThrow(String txnId) {
        Optional<Transaction> txn = transactionRepository.findByTxnId(txnId);
        if (!txn.isPresent() || txn.get().getStatus() != TransactionStatus.PENDING) {
            throw new IllegalTransactionStateException(
                    "Transaction " + txnId + " is not pending (current: " + txn.get().getStatus() + ")");
        }
        return txn.get();
    }

    public List<SearchUser> searchUser(String query) {
        Pageable pageable = PageRequest.of(0, DEFAULT_PAGE_SIZE);
        Page<User> users = userRepository.searchUsers(query, pageable);
        List<SearchUser> searchUsers = new ArrayList<>();
        for (User user : users) {
            searchUsers.add(new SearchUser(user.getId(), user.getName(), user.getEmail(), user.getPhone()));
        }
        return searchUsers;
    }

    @Transactional
    @CacheEvict(value = "remitters", allEntries = true)
    public AddedRemitter createRemitter(AddRemitter addRemitter) {

        if (userRepository.existsByEmail(addRemitter.getRemitterEmail())) {
            log.error("A user already exists with email {}", addRemitter.getRemitterEmail());
            throw new IllegalArgumentException("A user with this email already exists");
        }

        List<Remitter> conflicts = remitterRepository.findConflicts(
                addRemitter.getRemitterEmail(),
                addRemitter.getRemitterPhone(),
                addRemitter.getAadharNumber(),
                addRemitter.getPanNumber(),
                addRemitter.getRemitterCode());

        if (!conflicts.isEmpty()) {
            int emailConflict = 0;
            int phoneConflict = 0;
            int aadharConflict = 0;
            int panConflict = 0;
            int codeConflict = 0;
            for (Remitter existing : conflicts) {
                if (existing.getRemitterEmail().equals(addRemitter.getRemitterEmail())) {
                    emailConflict++;
                }
                if (existing.getRemitterPhone().equals(addRemitter.getRemitterPhone())) {
                    phoneConflict++;
                }
                if (existing.getRemitterCode().equals(addRemitter.getRemitterCode())) {
                    codeConflict++;
                }
                if (existing.getAadharNumber().equals(addRemitter.getAadharNumber())) {
                    aadharConflict++;
                }
                if (existing.getPanNumber().equals(addRemitter.getPanNumber())) {
                    panConflict++;
                }
                throw new IllegalArgumentException("A remitter with this " + (emailConflict > 0 ? "email, " : "")
                        + (phoneConflict > 0 ? "phone number, " : "") + (aadharConflict > 0 ? "aadhar number, " : "")
                        + (panConflict > 0 ? "pan number " : "") + (codeConflict > 0 ? "remitter code " : "")
                        + "already exists");
            }

        }

        String rawPassword = generateRandomPassword();

        Remitter remitter = new Remitter();
        remitter.setOrganizationName(addRemitter.getOrganizationName());
        remitter.setRemitterEmail(addRemitter.getRemitterEmail());
        remitter.setRemitterCode(addRemitter.getRemitterCode());
        remitter.setRemitterPhone(addRemitter.getRemitterPhone());
        remitter.setAllocationLimit(addRemitter.getAllocationLimit());
        remitter.setAadharNumber(addRemitter.getAadharNumber());
        remitter.setPanNumber(addRemitter.getPanNumber());
        remitter.setStatus(addRemitter.getStatus());
        remitter.setPassword(apiService.makePasswordHash(rawPassword));

        Remitter saved = remitterRepository.save(remitter);

        crucialNotificationService.notifyRemitter(
                EssentialActionType.REMITTER_ONBOARDED,
                saved,
                "/remitter/login",
                Map.of("limit", saved.getAllocationLimit() != null ? saved.getAllocationLimit().toString() : "0"));

        log.info("Remitter created successfully with id {}", saved.getRemitterId());
        // write log
        activityLogService.log("adminId", "AdminName", "admin", ActivityType.REMITTER_ADDED,
                saved.getOrganizationName() + " is added by admin", "remitter", saved.getRemitterId(), null);

        return new AddedRemitter(
                saved.getRemitterId(), // loginId — remitter logs in with their email
                rawPassword,
                saved.getRemitterEmail(), // plaintext, returned once so admin can share it
                saved.getRemitterId());
    }

    private String generateRandomPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnopqrstuvwxyz";
        String digits = "23456789";
        String special = "!@#$%^&*";
        String allChars = upper + lower + digits + special;

        SecureRandom random = new SecureRandom();
        List<Character> password = new ArrayList<>();

        // Guarantee at least one of each required character type.
        password.add(upper.charAt(random.nextInt(upper.length())));
        password.add(lower.charAt(random.nextInt(lower.length())));
        password.add(digits.charAt(random.nextInt(digits.length())));
        password.add(special.charAt(random.nextInt(special.length())));

        // Fill the rest randomly to reach 12 characters total.
        for (int i = password.size(); i < 12; i++) {
            password.add(allChars.charAt(random.nextInt(allChars.length())));
        }

        Collections.shuffle(password, random);

        StringBuilder sb = new StringBuilder();
        for (char c : password) {
            sb.append(c);
        }
        return sb.toString();
    }

    @Cacheable(value = "remitters", key = "#pageable")
    public PagedResponse<RemitterResponse> getAllRemitters(Pageable pageable) {

        var remitters = remitterRepository.findAll(pageable);
        var mapped = remitters.map(RemitterResponse::fromEntity);
        return PagedResponse.from(mapped, pageable.getPageNumber(), pageable.getPageSize());
    }

    @Transactional
    @CacheEvict(value = "remitters", allEntries = true)
    public boolean updateRemitter(String id, AddRemitter updateRemitter) {

        Remitter existing = remitterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Remitter not found with id " + id));

        List<Remitter> conflicts = remitterRepository.findConflicts(
                updateRemitter.getRemitterEmail(),
                updateRemitter.getRemitterPhone(),
                updateRemitter.getAadharNumber(),
                updateRemitter.getPanNumber(),
                updateRemitter.getRemitterCode());

        // A conflict against itself (unchanged fields) is not actually a conflict.
        conflicts.removeIf(r -> r.getRemitterId().equals(id));

        List<String> errors = new ArrayList<>();
        for (Remitter conflict : conflicts) {
            if (conflict.getRemitterEmail().equals(updateRemitter.getRemitterEmail())
                    && !(conflict.getRemitterEmail().equals(existing.getRemitterEmail()))) {
                errors.add("A remitter with this email already exists");
            }
            if (conflict.getRemitterPhone().equals(updateRemitter.getRemitterPhone())
                    && !(conflict.getRemitterPhone().equals(existing.getRemitterPhone()))) {
                errors.add("A remitter with this phone number already exists");
            }
            if (conflict.getAadharNumber().equals(updateRemitter.getAadharNumber())
                    && !(conflict.getAadharNumber().equals(existing.getAadharNumber()))) {
                errors.add("A remitter with this Aadhar number already exists");
            }
            if (conflict.getPanNumber().equals(updateRemitter.getPanNumber())) {
                errors.add("A remitter with this PAN number already exists");
            }
            if (conflict.getRemitterCode().equals(updateRemitter.getRemitterCode())) {
                errors.add("A remitter with this remitter code already exists");
            }
        }

        if (!errors.isEmpty()) {
            throw new DuplicateResourceException(errors);
        }
        if (!existing.getAllocationLimit().equals(updateRemitter.getAllocationLimit())) {
            crucialNotificationService.notifyRemitter(
                    EssentialActionType.LIMIT_UPDATED,
                    existing,
                    "/remitter/dashboard",
                    Map.of("old", existing.getAllocationLimit().toString(), "new",
                            updateRemitter.getAllocationLimit().toString()));
            existing.setAllocationLimit(updateRemitter.getAllocationLimit());
        }

        existing.setOrganizationName(updateRemitter.getOrganizationName());
        existing.setRemitterPhone(updateRemitter.getRemitterPhone());
        existing.setAadharNumber(updateRemitter.getAadharNumber());
        existing.setPanNumber(updateRemitter.getPanNumber());
        existing.setStatus(updateRemitter.getStatus());
        // remitterEmail intentionally left untouched — entity marks it
        // `updatable =
        // false`

        Remitter saved = remitterRepository.save(existing);
        // write log
        activityLogService.log("adminId", "AdminName", "admin", ActivityType.REMITTER_UPDATED,
                "Remitter is updated by admin", "remitter", id, null);

        log.info("Remitter updated successfully with id {}", saved.getRemitterId());

        return true;
    }

    @CacheEvict(value = "remitters", allEntries = true)
    public boolean removeRemitter(String id) {
        if (id == null || id.isBlank()) {
            return false;
        }
        try {
            Thread.sleep(2000);
            boolean isDeleted = remitterRepository.existsById(id);

            if (!isDeleted)
                return false;
            remitterRepository.deleteById(id);
            // write log
            activityLogService.log("adminId", "AdminName", "admin", ActivityType.REMITTER_DELETED,
                    "Remitter is removed by admin", "remitter", id, null);
            log.info("Remitter deleted successfully with id {}", id);

            return true;
        } catch (Exception e) {
            log.error("Error while deleting remitter: " + e.getMessage());
            return false;
        }
    }

    public PagedResponse<AdminUser> getAllUsers(Pageable pageable) {
        try {
            var users = userRepository.findByRole(Role.GRAHAK, pageable);
            // remove admin users from the list admin users are not needed in the list
            var mapped = users.map(AdminUser::toAdminUser);
            return PagedResponse.from(mapped, pageable.getPageNumber(), pageable.getPageSize());
        } catch (Exception e) {
            log.error("Error while fetching all users: " + e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<IssueResponse> issues(Status status, Pageable pageable) {
        try {
            var issuesPage = supportIssueRepository.findByStatus(status, pageable);
            var mapped = issuesPage.map(IssueResponse::fromEntity);
            return PagedResponse.from(mapped, pageable.getPageNumber(), pageable.getPageSize());
        } catch (Exception e) {
            log.error("Error while fetching issues: " + e.getMessage());
            return null;
        }
    }

    public Map<String, Object> sendReply(String issueId, String reply) {
        try {
            SupportIssue issue = supportIssueRepository.findById(issueId)
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found with id " + issueId));
            User user = userRepository.findById(issue.getSubmitterId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("User not found with id " + issue.getSubmitterId()));
            Reply r = new Reply();
            r.setSupportIssue(issue);
            r.setSenderType(Reply.SenderType.ADMIN);
            r.setText(reply);
            issue.addReply(r);
            issue.setStatus(Status.IN_PROGRESS);
            supportIssueRepository.save(issue);
            crucialNotificationService.notifyUser(EssentialActionType.ISSUE_REPLIED, user, "/dashboard", null);
            return general.response("success", "Reply added successfully", true);
        } catch (Exception e) {
            log.error("Error while adding reply: " + e.getMessage());
            return general.response("error", "Failed to add reply", false);
        }
    }

    public Map<String, Object> markIssueResolved(String id) {
        try {
            SupportIssue issue = supportIssueRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Issue not found with id " + id));
            issue.setStatus(Status.CLOSED);
            supportIssueRepository.save(issue);
            activityLogService.log("adminId", "AdminName", "admin", ActivityType.ISSUE_RESOLVED,
                    "Issue is resolved by admin", "support_issue", id, null);
            return general.response("success", "Issue marked as resolved...", true);
        } catch (Exception e) {
            log.error("Error while marking issue resolved: " + e.getMessage());
            return general.response("error", "Failed to mark issue resolved", false);
        }
    }

    @Cacheable(value = "overviewStats", key = "'adminOverview'", unless = "#result == null")
    public Map<String, Object> getOverviewStats() {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(14);

            BigDecimal totalAUM = userSchemeRepository.findTotalAUM();
            long activeInvestors = userSchemeRepository.countActiveInvestors();
            BigDecimal pendingWithdrawalAmount = transactionRepository.sumPendingWithdrawalAmount();
            long pendingWithdrawalCount = transactionRepository.countPendingWithdrawals();
            long openIssues = supportIssueRepository.countOpenIssues();

            // Daily inflow for the last 14 days
            List<Map<String, Object>> rawInflow = transactionRepository.findDailyInflow(since);
            List<Map<String, Object>> inflowData = rawInflow.stream().map(row -> {
                Map<String, Object> point = new LinkedHashMap<>();
                Object day = row.get("day");
                point.put("day", day != null ? day.toString() : "");
                point.put("amount", row.get("amount"));
                return point;
            }).toList();

            // Withdrawal status breakdown
            List<Map<String, Object>> rawBreakdown = transactionRepository.findStatusBreakdown();
            Map<String, Object> statusBreakdown = new LinkedHashMap<>();
            for (Map<String, Object> row : rawBreakdown) {
                statusBreakdown.put(String.valueOf(row.get("status")), row.get("count"));
            }

            // Per-scheme AUM
            List<Map<String, Object>> schemeAUM = userSchemeRepository.findSchemeAumBreakdown().stream().map(row -> {
                Map<String, Object> point = new java.util.LinkedHashMap<>();
                point.put("schemeName", row.get("schemeName"));
                point.put("aum", row.get("aum"));
                return point;
            }).toList();

            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("totalAUM", totalAUM);
            result.put("activeInvestors", activeInvestors);
            result.put("pendingWithdrawalAmount", pendingWithdrawalAmount);
            result.put("pendingWithdrawalCount", pendingWithdrawalCount);
            result.put("openIssues", openIssues);
            result.put("inflowData", inflowData);
            result.put("statusBreakdown", statusBreakdown);
            result.put("schemeAUM", schemeAUM);
            return result;
        } catch (Exception e) {
            log.error("Error while fetching overview stats: " + e.getMessage());
            return null;
        }

    }

    // pending--------------------------------------------------------------------------------------------------------

    // @Cacheable(value = "adminDashboard", key = "#range ?: 'default'")
    // @Transactional(readOnly = true)
    // public Map<String, Object> adminDashboard(String range) {
    // Page<WithdrawalRequest> withdrawals =
    // withdrawalRequestRepository.findAllByOrderByCreatedAtDesc(pageable("1"));
    // Page<SupportIssue> issues = supportIssueRepository.findAll(pageable("1"));
    // Page<FundraiserCode> codes = fundraiserCodeRepository.findAll(pageable("1"));
    // Page<User> users = userRepository.findAll(pageable("1"));

    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("range", range);
    // data.put("summary", Map.of(
    // "totalUsers", userRepository.count(),
    // "activeUsers", userRepository.countByActive(true),
    // "activeRemitters", remitterRepository.countActive(),
    // "pendingRemitters", remitterRepository.countPending(),
    // "pendingWithdrawals",
    // withdrawalRequestRepository.countByStatus(WithdrawalStatus.PENDING),
    // "openIssues", supportIssueRepository.countOpenIssues(),
    // "successfulVolume",
    // transactionRepository.sumSuccessfulAmountBetween(LocalDateTime.now().minusDays(30),
    // LocalDateTime.now())));
    // data.put("inflowData", inflowData());
    // data.put("withdrawals",
    // withdrawals.getContent().stream().map(this::toWithdrawalView).toList());
    // data.put("issues",
    // issues.getContent().stream().map(this::toIssueView).toList());
    // data.put("codes",
    // codes.getContent().stream().map(this::toFundraiserCodeView).toList());
    // data.put("eventTemplates", eventTemplates());
    // data.put("names", users.getContent().stream().map(User::getName).toList());
    // return general.response("ok", "Admin dashboard data fetched", data);
    // }

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
        return general.response("success", "Issue resolved", toIssueView(supportIssueRepository.save(issue)));
    }

    public PagedResponse<SchemeAuditProjection> findDistinctSchemeIdAndNameFromAudit(int offset, int limit) {
        // 1. Get the Envers AuditReader tool from the EntityManager
        AuditReader auditReader = AuditReaderFactory.get(entityManager);

        // 2. Fetch raw audit rows for the Scheme entity.
        // NOTE: no .count() or .group() here — we pull every revision as a
        // plain row and do the aggregation ourselves in Java below.
        // This avoids relying on Envers to generate a valid GROUP BY SQL clause,
        // which isn't supported cleanly in this version of the API.
        List<Object[]> results = auditReader.createQuery()
                .forRevisionsOfEntity(Scheme.class, false, true)
                .addProjection(AuditEntity.property("schemeId")) // row[0]
                .addProjection(AuditEntity.property("schemeName")) // row[1]
                .addProjection(AuditEntity.property("schemeCategory")) // row[2]
                .addProjection(AuditEntity.property("riskLevel")) // row[3]
                .addProjection(AuditEntity.property("status")) // row[4]
                .addProjection(AuditEntity.revisionNumber()) // row[5] - one per revision, not aggregated
                .getResultList();

        // 3. Group rows by the combination of (schemeId, schemeName, schemeCategory,
        // riskLevel, status) and count how many revisions fall into each group.
        // This is the Java equivalent of "GROUP BY these 5 columns, COUNT(rev)".
        Map<List<Object>, Long> counts = results.stream()
                .collect(Collectors.groupingBy(
                        row -> List.of(row[0], row[1], row[2], row[3], row[4]), // grouping key
                        Collectors.counting() // aggregate: count revisions per key
                ));

        // 4. Convert each (groupKey -> count) entry back into an Object[] shaped
        // like the original Envers projection (5 fields + count), then map
        // to the DTO using the existing toDto() converter.
        return PagedResponse.from(counts.entrySet().stream()
                .map(entry -> {
                    List<Object> key = entry.getKey();
                    Object[] row = new Object[] {
                            key.get(0), // schemeId
                            key.get(1), // schemeName
                            key.get(2), // schemeCategory
                            key.get(3), // riskLevel
                            key.get(4), // status
                            entry.getValue() // count of revisions in this group
                    };
                    return SchemeAuditProjection.toDto(row);
                })
                .toList(), offset, limit);
    }

    @Cacheable(value = "schemeUpdateHistory", key = "#schemeId + '-' + #offset + '-' + #limit")
    @Transactional(readOnly = true)
    public PagedResponse<SchemeUpdateHistory> getSelectedSchemeHistory(String schemeId, int offset, int limit) {
        Revisions<Integer, Scheme> revisions = schemeRepository.findRevisions(schemeId);
        List<SchemeUpdateHistory> schemeUpdateHistories = revisions.stream().map(r -> SchemeUpdateHistory.fromEntity(r))
                .toList();
        return PagedResponse.from(schemeUpdateHistories, offset, limit);

    }

    // @Cacheable(value = "remitters", key = "#page ?: 'default'")
    // @Transactional(readOnly = true)
    // public Map<String, Object> remitters(String page) {
    // Page<Remitter> remitters = remitterRepository.findAll(pageable(page));
    // Map<String, Object> data = paginatedMeta(remitters);
    // data.put("items",
    // remitters.getContent().stream().map(this::toRemitterView).toList());
    // return general.response("ok", "Remitters fetched", data);
    // }

    // @CacheEvict(value = { "adminDashboard", "remitters" }, allEntries = true)
    // @Transactional
    // public Map<String, Object> createRemitter(Map<String, Object> payload) {
    // String email = firstString(payload, "remitterEmail", "email");
    // String phone = firstString(payload, "remitterPhone", "phone");
    // String name = firstString(payload, "remitterName", "name",
    // "organizationName");

    // if (email == null || phone == null || name == null) {
    // return general.response("error", "remitterName, remitterEmail, and
    // remitterPhone are required", Map.of());
    // }
    // if (userRepository.existsByEmail(email) ||
    // userRepository.existsByPhone(phone)) {
    // return general.response("error", "Remitter user already exists",
    // Map.of("email", email, "phone", phone));
    // }

    // User user = new User();
    // user.setName(name);
    // user.setEmail(email);
    // user.setPhone(phone);
    // user.setPasswordHash(firstString(payload, "password", "passwordHash") != null
    // ? firstString(payload, "password", "passwordHash")
    // : "ChangeMe@123");
    // user.setRole(User.Role.REMITTER);
    // user = userRepository.save(user);

    // Remitter remitter = new Remitter();
    // remitter.setUser(user);
    // remitter.setOrganizationName(name);
    // remitter.setPanNumber(firstString(payload, "panNumber"));
    // // remitter.setGstNumber(firstString(payload, "gstNumber"));
    // remitter.setStatus(Remitter.Status.ACTIVE);
    // remitter = remitterRepository.save(remitter);

    // String trackerCode = firstString(payload, "trackerCode", "code");
    // if (trackerCode != null) {
    // FundraiserCode code = new FundraiserCode();
    // code.setRemitter(remitter);
    // code.setCode(trackerCode);
    // code.setDescription("Default tracker for " + name);
    // code.setUsageLimit(intValue(payload.get("allocationLimit"), 1));
    // fundraiserCodeRepository.save(code);
    // }

    // return general.response("ok", "Remitter created", toRemitterView(remitter));
    // }

    // @Cacheable(value = "fundraiserCodes", key = "#page ?: 'default'")
    // @Transactional(readOnly = true)
    // public Map<String, Object> fundraiserCodes(String page) {
    // Page<FundraiserCode> codes =
    // fundraiserCodeRepository.findAll(pageable(page));
    // Map<String, Object> data = paginatedMeta(codes);
    // data.put("items",
    // codes.getContent().stream().map(this::toFundraiserCodeView).toList());
    // return general.response("ok", "Fundraiser codes fetched", data);
    // }

    // @CacheEvict(value = { "adminDashboard", "fundraiserCodes" }, allEntries =
    // true)
    // @Transactional
    // public Map<String, Object> createFundraiserCode(Map<String, Object> payload)
    // {
    // String codeValue = firstString(payload, "code", "trackerCode");
    // String remitterId = firstString(payload, "remitterId");
    // if (codeValue == null || remitterId == null) {
    // return general.response("error", "code and remitterId are required",
    // Map.of());
    // }
    // if (fundraiserCodeRepository.existsByCode(codeValue)) {
    // return general.response("error", "Fundraiser code already exists",
    // Map.of("code", codeValue));
    // }

    // Optional<Remitter> remitterOpt = remitterRepository.findById(remitterId);
    // if (remitterOpt.isEmpty()) {
    // return general.response("error", "Remitter not found", Map.of("remitterId",
    // remitterId));
    // }

    // FundraiserCode code = new FundraiserCode();
    // code.setRemitter(remitterOpt.get());
    // code.setCode(codeValue);
    // code.setDescription(firstString(payload, "description"));
    // code.setUsageLimit(intValue(payload.get("usageLimit"), 1));
    // return general.response("ok", "Fundraiser code created",
    // toFundraiserCodeView(fundraiserCodeRepository.save(code)));
    // }

    // private List<Map<String, Object>> inflowData() {
    // LocalDateTime now = LocalDateTime.now();
    // DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
    // return java.util.stream.IntStream.rangeClosed(0, 13)
    // .mapToObj(daysAgo -> {
    // LocalDateTime day = now.minusDays(13L - daysAgo);
    // LocalDateTime start = day.toLocalDate().atStartOfDay();
    // LocalDateTime end = start.plusDays(1).minusNanos(1);
    // return Map.<String, Object>of(
    // "day", formatter.format(day),
    // "amount", transactionRepository.sumSuccessfulAmountBetween(start, end));
    // })
    // .toList();
    // }

    private List<Map<String, Object>> eventTemplates() {
        return List.of(
                Map.of("type", "deposit", "text", "deposited", "amountRange", List.of(5000, 60000)),
                Map.of("type", "withdrawal", "text", "requested a withdrawal of", "amountRange", List.of(3000, 40000)),
                Map.of("type", "signup", "text", "created a new account"),
                Map.of("type", "kyc", "text", "completed KYC verification"),
                Map.of("type", "referral", "text", "joined via fundraiser code"));
    }

    private Map<String, Object> toIssueView(SupportIssue issue) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", issue.getId());
        data.put("subject", issue.getTitle());
        data.put("title", issue.getTitle());
        data.put("message", issue.getDescription());
        data.put("priority", issue.getPriority().name().toLowerCase());
        data.put("status", issue.getStatus().name().toLowerCase());
        data.put("createdAt", issue.getCreatedAt());
        data.put("resolvedAt", issue.getResolvedAt());
        return data;
    }

    // private Map<String, Object> toFundraiserCodeView(FundraiserCode code) {
    // BigDecimal raised = code.getRemitter() != null
    // ?
    // transactionRepository.sumSuccessfulAmountByRemitter(code.getRemitter().getId())
    // : BigDecimal.ZERO;
    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("id", code.getId());
    // data.put("code", code.getCode());
    // data.put("owner", code.getRemitter().getOrganizationName());
    // data.put("raised", raised);
    // data.put("goal", code.getUsageLimit());
    // data.put("referrals", code.getUsageCount());
    // data.put("status", code.isActive() ? "active" : "paused");
    // data.put("description", code.getDescription());
    // data.put("expiresAt", code.getExpiresAt());
    // return data;
    // }

    private Map<String, Object> toRemitterView(AddRemitter remitter) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("name", remitter.getOrganizationName());
        data.put("organizationName", remitter.getOrganizationName());
        data.put("email", remitter.getRemitterEmail());
        data.put("phone", remitter.getRemitterPhone());
        // data.put("gstNumber", remitter.getGstNumber());
        data.put("panNumber", remitter.getPanNumber());
        // data.put("status", remitter.getRemitterStatus());
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

    private Optional<WithdrawalStatus> parseWithdrawalStatus(String status) {
        try {
            return status == null || status.isBlank()
                    ? Optional.empty()
                    : Optional.of(WithdrawalStatus.valueOf(status.trim().toUpperCase()));
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

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminNotifications(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size > 0 ? size : DEFAULT_PAGE_SIZE,
                Sort.by("createdAt").descending());
        Page<Notification> result = notificationRepository.findByReceiverType(ReceiverType.Admin, pageable);
        long unreadCount = notificationRepository.countByReceiverTypeAndRead(ReceiverType.Admin, false);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("currentPage", page);
        data.put("totalPages", result.getTotalPages());
        data.put("totalItems", result.getTotalElements());
        data.put("unreadCount", unreadCount);
        data.put("items", result.getContent().stream().map(this::toAdminNotificationView).toList());
        return general.response("ok", "Admin notifications fetched", data);
    }

    @Transactional
    public Map<String, Object> markAdminNotificationsAsRead(List<String> notificationIds) {
        int updated = (notificationIds == null || notificationIds.isEmpty())
                ? notificationRepository.markAllAdminAsRead(ReceiverType.Admin)
                : notificationRepository.markAdminAsRead(ReceiverType.Admin, notificationIds);
        return general.response("ok", "Admin notifications marked as read", Map.of("updatedCount", updated));
    }

    private Map<String, Object> toAdminNotificationView(Notification n) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", n.getId());
        data.put("receiverId", n.getReceiverId());
        data.put("receiverType", n.getReceiverType());
        data.put("title", n.getTitle());
        data.put("message", n.getMessage());
        data.put("type", n.getNotificationType());
        data.put("actionType", n.getActionType());
        data.put("read", n.isRead());
        data.put("actionUrl", n.getActionUrl());
        data.put("createdAt", n.getCreatedAt());
        data.put("updatedAt", n.getUpdatedAt());
        return data;
    }

    public User getUserById(String id) {
        if (id == null || id.isBlank())
            return null;
        return userRepository.findById(id).orElse(null);
    }

    public Remitter getRemitterById(String id) {
        if (id == null || id.isBlank())
            return null;
        return remitterRepository.findById(id).orElse(null);
    }

}
