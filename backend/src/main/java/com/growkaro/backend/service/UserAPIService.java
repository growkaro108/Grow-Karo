package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DTO.AuthUserData;
import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;
import com.growkaro.backend.repository.NotificationRepository;
import com.growkaro.backend.repository.SchemeRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;
import com.growkaro.backend.repository.WithdrawalRequestRepository;

@Service
public class UserAPIService {

    private static final Logger log = LoggerFactory.getLogger(UserAPIService.class);
    private static final int DEFAULT_PAGE_SIZE = 20;

    private final ApiService apiService;
    private final RecipientService recipientService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final SchemeRepository schemeRepository;
    private final UserSchemeRepository userSchemeRepository;
    private final General general;

    public UserAPIService(ApiService apiService, RecipientService recipientService,
            UserRepository userRepository,
            TransactionRepository transactionRepository,
            NotificationRepository notificationRepository,
            WithdrawalRequestRepository withdrawalRequestRepository, SchemeRepository schemeRepository,
            UserSchemeRepository userSchemeRepository,
            General general) {
        this.apiService = apiService;
        this.recipientService = recipientService;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.schemeRepository = schemeRepository;
        this.userSchemeRepository = userSchemeRepository;
        this.general = general;
    }

    public boolean testApi() {
        return true;
    }

    public boolean isUserExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existByUserId(String id) {
        return userRepository.existsById(id);
    }

    public boolean existUserSchemeId(String userSchemeId) {
        return userSchemeRepository.existsById(userSchemeId);
    }

    @Transactional
    public boolean userSignup(UserRegister user) {
        String email = stringValue(user.email());
        String phone = stringValue(user.phone());
        String name = stringValue(user.name());
        String passwordHash = stringValue(user.passwordHash());

        if (name == null || email == null || phone == null || passwordHash == null) {
            return false;
        }

        if (isUserExists(email)) {
            return false;
        }
        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPhone(phone);
        newUser.setPasswordHash(apiService.makePasswordHash(passwordHash));

        BankDetails bankDetails = new BankDetails();
        bankDetails.setBankName(stringValue(user.bankName()));
        bankDetails.setAccountHolderName(stringValue(user.accountHolderName()));
        bankDetails.setAccountNumber(stringValue(user.accountNumber()));
        bankDetails.setIfscCode(stringValue(user.ifscCode()));
        bankDetails.setUser(newUser);
        newUser.setBankDetails(bankDetails);

        try {
            userRepository.save(newUser);
            return true;
        } catch (DataIntegrityViolationException e) {
            log.warn("Signup failed due to data integrity violation for email={}", email, e);
            return false;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> login(String email, String password) {
        Optional<User> userOpt = email == null
                ? Optional.empty()
                : userRepository.findByEmail(email);

        if (userOpt.isEmpty() || password == null || !BCrypt.checkpw(password, userOpt.get().getPasswordHash())) {
            return general.response("error", "Invalid email/phone or password", Map.of());
        }

        User user = userOpt.get();
        AuthUserData finalUser = general.toAuthUserData(user);
        finalUser.setToken("local-dev-token");

        return general.response("ok", "Login successful", Map.of("user", finalUser));
    }

    public Map<String, Object> enrollScheme(String schemeId, String userId) {
        try {
            List<Object[]> results = schemeRepository.findSchemeAndUserByIds(schemeId, userId);

            if (results.isEmpty()) {
                return general.response("error", "Scheme or User not found", null);
            }

            Object[] row = results.get(0);
            Scheme scheme = (Scheme) row[0];
            User user = (User) row[1];
            if (scheme == null || user == null) {
                return general.response("error", "Scheme or User not found", null);
            }

            Optional<UserScheme> existingEnrollment = userSchemeRepository.findBySchemeAndUser(scheme, user);
            if (existingEnrollment.isPresent()) {
                return general.response("info", "User is already enrolled in this scheme", null);
            }

            UserScheme newUserScheme = new UserScheme();
            newUserScheme.setScheme(scheme);
            newUserScheme.setUser(user);
            userSchemeRepository.save(newUserScheme);

            return general.response("success", "Scheme enrolled successfully", null);
        } catch (Exception e) {
            log.error("Error enrolling scheme {} for user {}", schemeId, userId, e);
            return general.response("error", "Scheme enrollment failed. Please try again.", null);
        }
    }

    public Map<String, Object> getMyScheme(String userId) {
        try {
            Optional<User> userOpt = resolveUser(userId);
            if (userOpt.isEmpty()) {
                return general.response("error", "User not found", Map.of("id", userId));
            }
            List<String> userSchemesIds = userSchemeRepository.findAllJoinedSchemeId(userOpt.get());
            return general.response("success", "User schemes fetched", userSchemesIds);
        } catch (Exception e) {
            log.error("Failed to fetch schemes for user {}", userId, e);
            return general.response("error", "Failed to fetch user schemes. Please try again.", null);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserPortfolio(String userId) {
        try {
            if (!existByUserId(userId)) {
                return general.response("error", "User not found", null);
            }
            // filter with status not WITHDRAWN and REJECTED
            List<UserPortfolio> portfolios = userSchemeRepository
                    .findAllByUserIdWithSchemeDetails(userId)
                    .stream()
                    .filter(us -> us.getStatus() != UserSchemeStatus.WITHDRAWN
                            && us.getStatus() != UserSchemeStatus.REJECTED)
                    .map(general::toUserPortfolio)
                    .toList();

            return general.response("success", "User portfolios fetched", portfolios);
        } catch (Exception e) {
            log.error("Failed to fetch portfolio for user {}", userId, e);
            return general.response("error", "Something went wrong. Please try again.", null);
        }
    }

    @Transactional
    public Map<String, Object> userSchemeWithdrawEnrollRequest(String userSchemeId, String userId) {
        if (!existByUserId(userId)) {
            return general.response("error", "Invalid data", null);
        }

        try {
            Optional<UserScheme> userSchemeOpt = userSchemeRepository.findById(userSchemeId);
            if (userSchemeOpt.isEmpty()) {
                return general.response("error", "Request record not found", null);
            }

            UserScheme userScheme = userSchemeOpt.get();
            if (!userScheme.getUser().getId().equals(userId)) {
                return general.response("info", "User not enrolled in this scheme", null);
            }
            switch (userScheme.getStatus()) {
                case ACTIVE:
                    return general.response("info", "Application is already active and cannot be withdrawn", null);
                case WITHDRAWN:
                    return general.response("info", "Application has already been withdrawn", null);
                case REJECTED:
                    return general.response("info", "Application has already been rejected", null);
                case PENDING:
                    userScheme.setStatus(UserScheme.UserSchemeStatus.WITHDRAWN);
                    userSchemeRepository.save(userScheme);
                    return general.response("success", "Application withdrawn successfully", null);
                default:
                    return general.response("info", "Application cannot be withdrawn at this time", null);
            }
        } catch (Exception e) {
            log.error("Error withdrawing userScheme {} for user {}", userSchemeId, userId, e);
            return general.response("error", "Something went wrong while processing your cancellation request", null);
        }
    }

    @Cacheable(value = "userProfile", key = "#userId")
    @Transactional(readOnly = true)
    public Map<String, Object> userProfile(String userId) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        User user = userOpt.get();
        BigDecimal deposits = transactionRepository.sumSuccessfulAmountByUser(user.getId());
        BigDecimal withdrawals = withdrawalRequestRepository.sumProcessedAmountByUser(user.getId());
        BigDecimal balance = deposits.subtract(withdrawals);

        Map<String, Object> profile = toUserProfile(user);
        profile.put("balance", balance);
        profile.put("portfolioValue", deposits);
        profile.put("holdings", List.of());
        profile.put("graphDataMap", Map.of());
        return general.response("ok", "User profile fetched", profile);
    }

    @CachePut(value = "userProfile", key = "#userId")
    @Transactional
    public Map<String, Object> updateUser(String userId, Map<String, Object> updates) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        User user = userOpt.get();
        applyUserUpdates(user, updates);
        return general.response("ok", "User updated successfully", toUserProfile(userRepository.save(user)));
    }

    @Caching(evict = {
            @CacheEvict(value = "userProfile", key = "#userId"),
            @CacheEvict(value = "userTransactions", allEntries = true),
            @CacheEvict(value = "userRecipients", allEntries = true),
            @CacheEvict(value = "userNotifications", key = "#userId")
    })
    @Transactional
    public Map<String, Object> deleteUser(String userId) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        User user = userOpt.get();
        user.setActive(false);
        userRepository.save(user);
        return general.response("ok", "User deactivated", Map.of("id", user.getId()));
    }

    @Cacheable(value = "userTransactions", key = "#userId + ':' + (#page != null ? #page : '1')")
    @Transactional(readOnly = true)
    public Map<String, Object> userTransactions(String userId, String page) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        Page<Transaction> transactions = transactionRepository.findByUserId(userOpt.get().getId(), pageable(page));
        return general.response("ok", "User transactions fetched",
                paginatedTransactions(transactions, "userId", userOpt.get().getId()));
    }

    @Cacheable(value = "userRecipients", key = "#userId + ':' + (#page != null ? #page : '1')")
    @Transactional(readOnly = true)
    public Map<String, Object> userRecipients(String userId, String page) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        Page<Recipient> recipients = recipientService.findByRecipientUserId(userOpt.get().getId(), parsePage(page));
        return general.response("ok", "User recipients fetched",
                recipientService.paginatedUserResponse(userOpt.get().getId(), recipients));
    }

    @Cacheable(value = "userNotifications", key = "#userId")
    @Transactional(readOnly = true)
    public Map<String, Object> userNotifications(String userId) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        Page<Notification> notifications = notificationRepository.findByUserId(userOpt.get().getId(), pageable("1"));
        Map<String, Object> data = paginatedMeta(notifications);
        data.put("userId", userOpt.get().getId());
        data.put("unreadCount", notificationRepository.countByUserIdAndRead(userOpt.get().getId(), false));
        data.put("items", notifications.getContent().stream().map(this::toNotificationView).toList());
        return general.response("ok", "User notifications fetched", data);
    }

    @CacheEvict(value = "userProfile", key = "#userId")
    @Transactional
    public Map<String, Object> changePassword(String userId, String oldPassword, String newPassword) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }
        if (oldPassword == null || newPassword == null || !general.validatePassword(newPassword)) {
            return general.response("error", "Invalid password data", null);
        }

        User user = userOpt.get();
        if (!BCrypt.checkpw(oldPassword, user.getPasswordHash())) {
            return general.response("error", "Old password is incorrect", Map.of("id", user.getId()));
        }
        user.setPasswordHash(apiService.makePasswordHash(newPassword));
        userRepository.save(user);
        return general.response("ok", "Password changed successfully", Map.of("id", user.getId()));
    }

    @CacheEvict(value = "userNotifications", key = "#userId")
    @Transactional
    public Map<String, Object> markNotificationsAsRead(String userId, List<String> notificationIds) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return general.response("error", "User not found", Map.of("id", userId));
        }

        int updated = notificationIds == null || notificationIds.isEmpty()
                ? notificationRepository.markAllAsRead(userOpt.get().getId())
                : notificationRepository.markAsRead(userOpt.get().getId(), notificationIds);
        return general.response("ok", "Notifications marked as read", Map.of("updatedCount", updated));
    }

    public Map<String, Object> updateNotificationSettings(String userId, Map<String, Boolean> settings) {
        // TODO: persist settings — currently just echoed back, not saved anywhere
        return general.response("ok", "Notification preferences updated",
                Map.of("userId", userId, "settings", settings));
    }

    private Optional<User> resolveUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findById(userId);
    }

    private Map<String, Object> toUserProfile(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", user.getId());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("bankName", user.getBankDetails().getBankName());
        data.put("accountHolderName", user.getBankDetails().getAccountHolderName());
        data.put("accountNumber", user.getBankDetails().getAccountNumber());
        data.put("ifscCode", user.getBankDetails().getIfscCode());
        data.put("role", user.getRole());
        data.put("active", user.isActive());
        data.put("emailVerified", user.isEmailVerified());
        data.put("phoneVerified", user.isPhoneVerified());
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());
        return data;
    }

    private Map<String, Object> paginatedTransactions(Page<Transaction> page, String ownerKey, String ownerId) {
        Map<String, Object> data = paginatedMeta(page);
        data.put(ownerKey, ownerId);
        data.put("items", page.getContent().stream().map(this::toTransactionView).toList());
        return data;
    }

    private Map<String, Object> toTransactionView(Transaction transaction) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", transaction.getId());
        data.put("amount", transaction.getAmount());
        data.put("status", transaction.getStatus());
        data.put("referenceId", transaction.getReferenceId());
        data.put("description", transaction.getRemarks());
        data.put("remarks", transaction.getRemarks());
        data.put("date", transaction.getCreatedAt());
        data.put("createdAt", transaction.getCreatedAt());
        data.put("updatedAt", transaction.getUpdatedAt());
        if (transaction.getRemitter() != null) {
            data.put("remitterId", transaction.getRemitter().getId());
            data.put("remitterName", transaction.getRemitter().getOrganizationName());
        }
        if (transaction.getRecipient() != null) {
            data.put("recipientId", transaction.getRecipient().getId());
            data.put("recipientName", transaction.getRecipient().getName());
        }
        return data;
    }

    private Map<String, Object> toNotificationView(Notification notification) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", notification.getId());
        data.put("message", notification.getMessage());
        data.put("type", notification.getType());
        data.put("read", notification.isRead());
        data.put("actionUrl", notification.getActionUrl());
        data.put("createdAt", notification.getCreatedAt());
        return data;
    }

    private Map<String, Object> paginatedMeta(Page<?> page) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("currentPage", page.getNumber() + 1);
        data.put("totalPages", page.getTotalPages());
        data.put("totalItems", page.getTotalElements());
        return data;
    }

    private void applyUserUpdates(User user, Map<String, Object> updates) {
        if (updates.containsKey("name")) {
            user.setName(stringValue(updates.get("name")));
        }
        if (updates.containsKey("email")) {
            String newEmail = stringValue(updates.get("email"));
            if (newEmail != null && !newEmail.equalsIgnoreCase(user.getEmail()) && isUserExists(newEmail)) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(newEmail);
        }
        if (updates.containsKey("phone")) {
            user.setPhone(stringValue(updates.get("phone")));
        }
        if (updates.containsKey("bankName")) {
            user.getBankDetails().setBankName(stringValue(updates.get("bankName")));
        }
        if (updates.containsKey("accountHolderName")) {
            user.getBankDetails().setAccountHolderName(stringValue(updates.get("accountHolderName")));
        }
        if (updates.containsKey("accountNumber")) {
            user.getBankDetails().setAccountNumber(stringValue(updates.get("accountNumber")));
        }
        if (updates.containsKey("ifscCode")) {
            user.getBankDetails().setIfscCode(stringValue(updates.get("ifscCode")));
        }
    }

    private Pageable pageable(String page) {
        return PageRequest.of(Math.max(parsePage(page), 1) - 1, DEFAULT_PAGE_SIZE);
    }

    private int parsePage(String page) {
        if (page == null || page.isBlank()) {
            return 1;
        }
        try {
            return Integer.parseInt(page);
        } catch (NumberFormatException ex) {
            return 1;
        }
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }
}