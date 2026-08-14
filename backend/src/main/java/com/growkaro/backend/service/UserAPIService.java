package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.jspecify.annotations.Nullable;
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
import org.springframework.web.bind.annotation.RequestBody;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DRO.WithdrawAmount;
import com.growkaro.backend.DTO.TransactionResponse;
import com.growkaro.backend.DTO.TransactionSummary;
import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserProfile;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.ActivityType;
import com.growkaro.backend.enums.UserSchemeStatus;
import com.growkaro.backend.repository.BankDetailsRepository;
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
    private final BankDetailsRepository bankDetailsRepository;
    private final General general;

    public UserAPIService(ApiService apiService,
            UserRepository userRepository,
            TransactionRepository transactionRepository,
            NotificationRepository notificationRepository,
            WithdrawalRequestRepository withdrawalRequestRepository, SchemeRepository schemeRepository,
            UserSchemeRepository userSchemeRepository,
            ActivityLogService activityLogService, BankDetailsRepository bankDetailsRepository,
            General general) {
        this.apiService = apiService;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.schemeRepository = schemeRepository;
        this.userSchemeRepository = userSchemeRepository;
        this.activityLogService = activityLogService;
        this.bankDetailsRepository = bankDetailsRepository;
        this.general = general;
    }

    @Transactional
    public boolean testApi() {
        try {
            List<UserScheme> allscheme = userSchemeRepository.findAll();

            for (UserScheme us : allscheme) {
                if (us.getIsApproved()) {
                    us.setMaturityDate(
                            general.calculateMaturityDate(us.getEnrollmentDate(), us.getScheme().getTenure()));
                    System.out.println(us.getUser().getId() + " is updated...");
                }
            }
            userSchemeRepository.saveAll(allscheme);
            System.out.println("All set::");
            return true;
        } catch (Exception e) {
            log.error("Failed to set user status active", e);
            return false;
        }
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

    public UserScheme getUserSchemeById(String userSchemeId) {
        if (userSchemeId == null || userSchemeId.isBlank()) {
            return null;
        }
        Optional<UserScheme> userScheme = userSchemeRepository.findById(userSchemeId);
        return userScheme.isPresent() ? userScheme.get() : null;
    }

    public Scheme getSchemeById(String schemeId) {
        if (schemeId == null || schemeId.isBlank()) {
            return null;
        }
        Optional<Scheme> scheme = schemeRepository.findById(schemeId);
        return scheme.isPresent() ? scheme.get() : null;
    }

    public User getUserById(String userId) {
        if (userId == null || userId.isBlank() || !(general.isValidId(userId))) {
            return null;
        }
        Optional<User> user = userRepository.findById(userId);
        return user.isPresent() ? user.get() : null;
    }

    public User getUserByEmail(String email) {
        if (email == null || email.isBlank() || !general.validateEmail(email)) {
            return null;
        }
        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() ? user.get() : null;
    }

    public List<Transaction> getAllUsersTransactions(String userId) {
        if (userId == null || userId.isBlank() || !(general.isValidId(userId))) {
            return null;
        }
        return transactionRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public Transaction getTransactionById(String txnId) {
        if (txnId == null || txnId.isBlank() || !(general.isValidId(txnId))) {
            return null;
        }
        Optional<Transaction> txn = transactionRepository.findById(txnId);
        return txn.isEmpty() ? null : txn.get();
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
        newUser.setEmailVerified(true);

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
        User user = getUserByEmail(email);

        if (user == null || password == null || !BCrypt.checkpw(password, user.getPasswordHash())) {
            log.error("Invalid email or password for email={}", email);
            return general.response("error", "Invalid email or password", Map.of());
        }
        String token = "local-dev-token";
        UserProfile finalUser = general.toUserProfile(user, token);
        activityLogService.log(
                user.getId(), user.getName(), "USER",
                ActivityType.LOGIN,
                user.getName() + " logged in",
                "USER", user.getId(),
                Map.of("email", user.getEmail()));

        return general.response("success", "Login successful", finalUser);
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
            log.error("Failed to fetch schemes for user {} because {}", userId, e.getMessage());
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

            TransactionSummary summary = transactionRepository.getTransactionSummaryByUser(user.getId());
            BigDecimal pendingSum = summary.getPendingSum();
            BigDecimal successSum = summary.getSuccessSum();

            return general.response("success", "User portfolios fetched",
                    Map.of("holdings", portfolios, "pendingSum", pendingSum, "successSum", successSum));
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
                    user.getName() + " withdraw from scheme " + schemeName,
                    "USER", user.getId() + "with ₹ " + userScheme.getPaidAmount(),
                    Map.of("userSchemeId", userSchemeId));

            return general.response("success", "Application withdrawn successfully", null);

        } catch (Exception e) {
            log.error("Error withdrawing userScheme {} for user {}", userSchemeId, userId, e);
            return general.response("error", e.getMessage() != null ? e.getMessage()
                    : "Something went wrong while processing your cancellation request", null);
        }
    }

    public Map<String, Object> changePassword(String userId, String password) {
        User user = null;
        try {
            user = getUserById(userId);
            if (user == null) {
                log.error("User not found for user id :{}", userId);
                return general.response("error", "Invalid Data...", null);
            }
            if (BCrypt.checkpw(password, user.getPasswordHash())) {
                return general.response("success", "Redirecting to login page...", null);
            }

            user.setPasswordHash(apiService.makePasswordHash(password));
            userRepository.save(user);
            activityLogService.log(
                    user.getId(), user.getName(), "USER",
                    ActivityType.PASSWORD_CHANGED,
                    "Password changed successfully", "USER", user.getId(),
                    Map.of("userId", userId));
            return general.response("success", "Password reset successfully", null);
        } catch (Exception e) {
            log.error("Error changing password for user {}", userId, e);
            return general.response("error", "Failed to change password. Please try again.", null);
        }
    }

    @CachePut(value = "userProfile", key = "#up.id()")
    @Transactional
    public Map<String, Object> updateUser(UserProfile up) {
        // create new token
        String token = "local-dev-token";

        User user = getUserById(up.id());
        if (user == null) {
            return general.response("error", "Invalid requests...", Map.of("id", up.id()));
        }

        if (!up.bankName().trim().isEmpty()
                && !up.accountHolderName().trim().isEmpty()
                && !up.accountNumber().trim().isEmpty()
                && !up.ifscCode().trim().isEmpty()) {

            // Reuse the existing bank_details row if the user already has one —
            // user_id is unique, so always creating `new BankDetails()` would
            // violate that constraint on the second save.
            BankDetails bankDetails = user.getBankDetails();
            if (bankDetails == null) {
                bankDetails = new BankDetails();
                bankDetails.setUser(user); // add new bank details
            }

            bankDetails.setBankName(up.bankName());
            bankDetails.setAccountHolderName(up.accountHolderName());
            bankDetails.setAccountNumber(up.accountNumber());
            bankDetails.setIfscCode(up.ifscCode());

            user.setBankDetails(bankDetails);
        }

        user.setName(up.name());
        user.setPhone(up.phone());
        user.setEmail(up.email());
        user.setSchemeAlerts(up.schemeAlerts());
        user.setSecurityAlerts(up.securityAlerts());
        userRepository.save(user);

        return general.response("success", "User updated successfully", general.toUserProfile(user, token));
    }

    @Transactional
    public Map<String, Object> redeemAmount(WithdrawAmount wa) {

        // basic amount validation
        if (wa.amount() == null || wa.amount().compareTo(BigDecimal.ZERO) <= 0) {
            return general.response("error", "Invalid amount...", null);
        }

        UserScheme us = getUserSchemeById(wa.userSchemeId());
        if (us == null) {
            return general.response("error", "Invalid userSchemeId...", null);
        }
        User user = us.getUser();
        // ownership check: scheme must belong to this user
        if (user == null || !user.getId().equals(wa.userId())) {
            log.info("userScheme does not belong to user..., {}",
                    Map.of("userSchemeId", us.getUserSchemeId(), "userId", wa.userId()));
            return general.response("error", "userScheme does not belong to user...", null);
        }
        if (!wa.isAggressive()) { // general withdrawal and redeem profit
            // guard against re-redeeming the same profit(profit==redeemed)
            // this check is optional as user can redeem his profit multiple times
            if (us.getProfit().subtract(us.getProfitReedemed()).compareTo(BigDecimal.ZERO) == 0) {
                log.info("profit already redeemed..., {}",
                        Map.of("userSchemeId", us.getUserSchemeId(), "profit", us.getProfit(), "profitRedeemed",
                                us.getProfitReedemed(), "amount", wa.amount(), "userId", user.getId(),
                                "redeemed_already",
                                us.getProfitReedemed()));
                return general.response("info", "profit already redeemed...", null);
            }
            if (us.getProfit() == null
                    || (us.getProfit().subtract(us.getProfitReedemed())).compareTo(wa.amount()) < 0) {
                log.info("Insufficient Profit...",
                        Map.of("userSchemeId", us.getUserSchemeId(), "profit", us.getProfit(), "profitRedeemed",
                                us.getProfitReedemed(), "amount", wa.amount(), "userId", user.getId()));
                return general.response("error", "Insufficient Profit...", null);
            }

        } else { // aggressive withdrawal
            if (us.getPaidAmount() == null || us.getPaidAmount().compareTo(wa.amount()) != 0) {
                log.info("paidAmount and amount doesn't match..., {}", Map.of("userSchemeId", us.getUserSchemeId(),
                        "paidAmount", us.getPaidAmount(), "amount", wa.amount(), "userId", user.getId()));
                return general.response("error", "paidAmount and amount doesn't match...", null);
            }
        }

        // is valid bank details
        BankDetails bankDetails;
        if (wa.bankDetailsId() == null) {
            if (wa.bankDetails() == null) {
                return general.response("error", "Invalid bankDetails...", null);
            }
            bankDetails = wa.bankDetails();
            bankDetails.setUser(null); // ensure new bank details are tied to the requesting user
            bankDetails = bankDetailsRepository.save(bankDetails);
        } else {
            bankDetails = bankDetailsRepository.findById(wa.bankDetailsId()).orElse(null);
            if (bankDetails == null) {
                return general.response("error", "Invalid bankDetailsId...", null);
            }
            // ownership check: bank details must belong to this user
            if (bankDetails.getUser() == null || !bankDetails.getUser().getId().equals(user.getId())) {
                return general.response("error", "bankDetails does not belong to user...", null);
            }
        }
        Transaction txn = new Transaction();
        txn.setUser(user);
        txn.setAmount(wa.amount());
        txn.setSchemeName(us.getScheme().getSchemeName());
        txn.setBankDetails(bankDetails);
        txn.setStatus(Transaction.TransactionStatus.PENDING);
        txn.setType(wa.isAggressive()
                ? Transaction.TransactionType.AGGRESSIVE_WITHDRAWAL
                : Transaction.TransactionType.GENERAL_WITHDRAWAL);
        txn.setUserScheme(us);
        transactionRepository.save(txn);

        // update redemption bookkeeping
        if (!wa.isAggressive()) {
            us.setProfitReedemed(wa.amount());
        } else {
            // if you track aggressive redemptions separately, set that field here instead
            // e.g. us.setPaidAmountRedeemed(wa.amount());
            us.setProfitReedemed(wa.amount());
        }
        userSchemeRepository.save(us);

        return general.response("success", "Withdraw request placed successfully", null);
    }

    public Map<String, Object> getTransactionsofUser(String userId) {
        List<Transaction> transactions = getAllUsersTransactions(userId);
        if (transactions == null) {
            return general.response("error", "Invalid requests...", Map.of("id", userId));
        }
        return general.response("success", "Transactions fetched", transactions.stream()
                .map(TransactionResponse::fromEntity)
                .toList());
    }

    //// pending
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

    // @Cacheable(value = "userTransactions", key = "#userId + ':' + (#page != null
    // ? #page : '1')")
    // @Transactional(readOnly = true)
    // public Map<String, Object> userTransactions(String userId, String page) {
    // User user = getUserById(userId);
    // if (user == null) {
    // return general.response("error", "Invalid requests...", Map.of("id",
    // userId));
    // }

    // Page<Transaction> transactions =
    // transactionRepository.findByUserId(user.getId(), pageable(page));
    // return general.response("ok", "User transactions fetched",
    // paginatedTransactions(transactions, "clientId", user.getId()));
    // }

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
        return general.response("ok", "Notification preferences updated",
                Map.of("userId", userId, "settings", settings));
    }

    // private Map<String, Object> paginatedTransactions(Page<Transaction> page,
    // String ownerKey, String ownerId) {
    // Map<String, Object> data = paginatedMeta(page);
    // data.put(ownerKey, ownerId);
    // data.put("items",
    // page.getContent().stream().map(this::toTransactionView).toList());
    // return data;
    // }

    // private Map<String, Object> toTransactionView(Transaction transaction) {
    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("id", transaction.getId());
    // data.put("amount", transaction.getAmount());
    // data.put("status", transaction.getStatus());
    // data.put("referenceId", transaction.getReferenceId());
    // data.put("description", transaction.getRemarks());
    // data.put("remarks", transaction.getRemarks());
    // data.put("date", transaction.getCreatedAt());
    // data.put("createdAt", transaction.getCreatedAt());
    // data.put("updatedAt", transaction.getUpdatedAt());
    // if (transaction.getRemitter() != null) {
    // data.put("remitterId", transaction.getRemitter().getId());
    // data.put("remitterName", transaction.getRemitter().getOrganizationName());
    // }
    // if (transaction.getRecipient() != null) {
    // data.put("recipientId", transaction.getRecipient().getId());
    // data.put("recipientName", transaction.getRecipient().getName());
    // }
    // return data;
    // }

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

    private Pageable pageable(String page) {
        return PageRequest.of(Math.max(parsePage(page), 1) - 1, DEFAULT_PAGE_SIZE);
    }

    private int parsePage(String page) {
        if (page == null || page.isBlank()) {
            return 1;
        }
        try {
            return Integer.parseInt(page);
        } catch (NumberFormatException nfe) {
            log.error(" parse int function Invalid page number", nfe);
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