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
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.ActivityType;
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
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final SchemeRepository schemeRepository;
    private final UserSchemeRepository userSchemeRepository;
    private final ActivityLogService activityLogService;
    private final General general;

    public UserAPIService(ApiService apiService,
            UserRepository userRepository,
            TransactionRepository transactionRepository,
            NotificationRepository notificationRepository,
            WithdrawalRequestRepository withdrawalRequestRepository, SchemeRepository schemeRepository,
            UserSchemeRepository userSchemeRepository,
            ActivityLogService activityLogService,
            General general) {
        this.apiService = apiService;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.schemeRepository = schemeRepository;
        this.userSchemeRepository = userSchemeRepository;
        this.activityLogService = activityLogService;
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

    public Scheme getSchemeById(String schemeId) {
        if (schemeId == null || schemeId.isBlank()) {
            return null;
        }
        Optional<Scheme> scheme = schemeRepository.findById(schemeId);
        return scheme.isPresent() ? scheme.get() : null;
    }

    public User getUserById(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        Optional<User> user = userRepository.findById(userId);
        return user.isPresent() ? user.get() : null;
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
            activityLogService.log(
                    newUser.getId(), newUser.getName(), "USER",
                    ActivityType.ACCOUNT_CREATED,
                    newUser.getName() + " created an account",
                    "USER", newUser.getId(),
                    Map.of("email", newUser.getEmail()));
            return true;
        } catch (DataIntegrityViolationException e) {
            log.warn("Signup failed due to data integrity violation for email={}", email, e);
            return false;
        }
    }

    @Transactional
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
        activityLogService.log(
                user.getId(), user.getName(), "USER",
                ActivityType.LOGIN,
                user.getName() + " logged in",
                "USER", user.getId(),
                Map.of("email", user.getEmail()));

        return general.response("ok", "Login successful", Map.of("user", finalUser));
    }

    public Map<String, Object> logout(String userId, String userName) {

        try {
            activityLogService.log(
                    userId, userName, "USER",
                    ActivityType.LOGOUT,
                    userName + " logged out",
                    "USER", "",
                    Map.of());
            return general.response("success", "Logout successful", Map.of());
        } catch (Exception e) {
            return general.response("error", "Logout failed", Map.of());
        }
    }

    public Map<String, Object> enrollInScheme(String schemeId, String userId, BigDecimal amount) {
        try {
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                return general.response("error", "Invalid request...", null);
            }

            User user = getUserById(userId);
            Scheme scheme = getSchemeById(schemeId);

            if (user == null || scheme == null || amount.compareTo(scheme.getMinimumAmount()) < 0) {
                return general.response("error", "Invalid request...", null);
            }

            UserScheme newUserScheme = new UserScheme();
            newUserScheme.setUser(user);
            newUserScheme.setPaidAmount(amount); // <-- was validated but never persisted
            scheme.enrollUserInScheme(newUserScheme); // sets scheme + adds to scheme's joinedUsers
            user.enrollInScheme(newUserScheme); // if you keep this method, make sure it doesn't create a second
                                                // UserScheme — see note below
            userSchemeRepository.save(newUserScheme);

            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.SCHEME_ENROLLED,
                    user.getName() + " enrolled in scheme " + scheme.getSchemeName(),
                    "USER", user.getId(),
                    Map.of("schemeId", schemeId));

            return general.response("success", "Scheme enrolled successfully", null);
        } catch (Exception e) {
            log.error("Error enrolling scheme {} for user {}", schemeId, userId, e);
            return general.response("error", "Scheme enrollment failed. Please try again.", null);
        }
    }

    public Map<String, Object> getMyScheme(String userId) {
        try {
            User user = getUserById(userId);
            if (user == null) {
                return general.response("error", "Invalid Data...", Map.of("id", userId));
            }
            List<String> userSchemesIds = userSchemeRepository.findAllJoinedSchemeId(user);
            return general.response("success", "User schemes fetched", userSchemesIds);
        } catch (Exception e) {
            log.error("Failed to fetch schemes for user {}", userId, e);
            return general.response("error", "Failed to fetch user schemes. Please try again.", null);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserPortfolio(String userId) {
        try {
            User user = getUserById(userId);
            if (user == null) {
                return general.response("error", "Invalid Data...", null);
            }
            List<UserPortfolio> portfolios = user.getEnrolledSchemes()
                    .stream()
                    // .filter(us -> us.getIsApproved())
                    .map(general::toUserPortfolio)
                    .toList();

            return general.response("success", "User portfolios fetched", portfolios);
        } catch (Exception e) {
            log.error("Failed to fetch portfolio for user {}", userId, e);
            return general.response("error", "Something went wrong. Please try again.", null);
        }
    }

    @Transactional
    public Map<String, Object> schemeWithdrawal(String userSchemeId, String userId) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid data", null);
        }
        try {
            Optional<UserScheme> userSchemeOpt = userSchemeRepository.findById(userSchemeId);
            if (userSchemeOpt.isEmpty()) {
                return general.response("error", "Request record not found", null);
            }
            UserScheme userScheme = userSchemeOpt.get();
            if (!user.getId().equals(userId)) {
                return general.response("info", "User not enrolled in this scheme", null);
            }

            Scheme scheme = userScheme.getScheme();
            String schemeName = (scheme != null) ? scheme.getSchemeName() : null;

            // Actually perform the withdrawal
            if (scheme != null) {
                scheme.removeUserFromScheme(userScheme); // removes from joinedUsers, nulls scheme ref
            }
            user.getEnrolledSchemes().remove(userScheme); // keep in-memory side consistent, if this collection exists

            userSchemeRepository.delete(userScheme);

            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.SCHEME_WITHDRAWAL,
                    user.getName() + " withdrew from scheme " + schemeName,
                    "USER", user.getId(),
                    Map.of("userSchemeId", userSchemeId));

            return general.response("success", "Application withdrawn successfully", null);

        } catch (Exception e) {
            log.error("Error withdrawing userScheme {} for user {}", userSchemeId, userId, e);
            return general.response("error", e.getMessage() != null ? e.getMessage()
                    : "Something went wrong while processing your cancellation request", null);
        }
    }

    //// pending
    @Cacheable(value = "userProfile", key = "#userId")
    @Transactional(readOnly = true)
    public Map<String, Object> userProfile(String userId) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
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
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }

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
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
        user.setActive(false);
        userRepository.save(user);
        return general.response("ok", "User deactivated", Map.of("id", user.getId()));
    }

    @Cacheable(value = "userTransactions", key = "#userId + ':' + (#page != null ? #page : '1')")
    @Transactional(readOnly = true)
    public Map<String, Object> userTransactions(String userId, String page) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }

        Page<Transaction> transactions = transactionRepository.findByUserId(user.getId(), pageable(page));
        return general.response("ok", "User transactions fetched",
                paginatedTransactions(transactions, "clientId", user.getId()));
    }

    @Cacheable(value = "userNotifications", key = "#userId")
    @Transactional(readOnly = true)
    public Map<String, Object> userNotifications(String userId) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }

        Page<Notification> notifications = notificationRepository.findByUserId(user.getId(), pageable("1"));
        Map<String, Object> data = paginatedMeta(notifications);
        data.put("userId", user.getId());
        data.put("unreadCount", notificationRepository.countByUserIdAndRead(user.getId(), false));
        data.put("items", notifications.getContent().stream().map(this::toNotificationView).toList());
        return general.response("ok", "User notifications fetched", data);
    }

    @CacheEvict(value = "userProfile", key = "#userId")
    @Transactional
    public Map<String, Object> changePassword(String userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
        if (oldPassword == null || newPassword == null || !general.validatePassword(newPassword)) {
            return general.response("error", "Invalid password data", null);
        }
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
        User user = getUserById(userId);
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }

        int updated = notificationIds == null || notificationIds.isEmpty()
                ? notificationRepository.markAllAsRead(user.getId())
                : notificationRepository.markAsRead(user.getId(), notificationIds);
        return general.response("ok", "Notifications marked as read", Map.of("updatedCount", updated));
    }

    public Map<String, Object> updateNotificationSettings(String userId, Map<String, Boolean> settings) {
        // TODO: persist settings — currently just echoed back, not saved anywhere
        return general.response("ok", "Notification preferences updated",
                Map.of("userId", userId, "settings", settings));
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