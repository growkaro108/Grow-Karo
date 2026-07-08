package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.repository.NotificationRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.WithdrawalRequestRepository;

@Service
public class UserAPIService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final ApiService apiService;

    private final RecipientService recipientService;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;

    public UserAPIService(ApiService apiService, RecipientService recipientService,
            UserRepository userRepository,
            TransactionRepository transactionRepository,
            NotificationRepository notificationRepository,
            WithdrawalRequestRepository withdrawalRequestRepository) {
        this.apiService = apiService;
        this.recipientService = recipientService;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
    }

    @Transactional
    public String userSignup(UserRegister user) {
        try {
            String email = stringValue(user.email());
            String phone = stringValue(user.phone());
            String name = stringValue(user.name());
            String passwordHash = stringValue(user.passwordHash());

            if (name == null || email == null || phone == null || passwordHash == null) {
                return "Name, email, phone and password are required";
            }
            // if (userRepository.existsByEmail(email) ||
            // userRepository.existsByPhone(phone)) {
            // return "User already exists";
            // }

            User newUser = new User();
            newUser.setName(name);
            newUser.setEmail(email);
            newUser.setPhone(phone);
            newUser.setPasswordHash(apiService.makePasswordHash(passwordHash));
            newUser.setBankName(stringValue(user.bankName()));
            newUser.setAccountHolderName(stringValue(user.accountHolderName()));
            newUser.setAccountNumber(stringValue(user.accountNumber()));
            newUser.setIfscCode(stringValue(user.ifscCode()));
            userRepository.save(newUser);
            return "success";
        } catch (Exception e) {
            return "Error registering user: " + e.getMessage();
        }
    }

    private Map<String, Object> response(String status, String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("data", data != null ? data : Map.of());
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> login(Map<String, Object> credentials) {
        String email = stringValue(credentials.get("email"));
        String password = stringValue(credentials.get("password"));

        Optional<User> userOpt = email == null
                ? Optional.empty()
                : userRepository.findByEmail(email);

        if (userOpt.isEmpty() || password == null || !BCrypt.checkpw(password, userOpt.get().getPasswordHash())) {
            return response("error", "Invalid email/phone or password", Map.of());
        }

        User user = userOpt.get();
        return response("ok", "Login successful", Map.of(
                "token", "local-dev-token",
                "user", Map.of()));
    }

    @Cacheable(value = "userProfile", key = "#userId")
    @Transactional(readOnly = true)
    public Map<String, Object> userProfile(String userId) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
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
        return response("ok", "User profile fetched", profile);
    }

    @CachePut(value = "userProfile", key = "#userId")
    @Transactional
    public Map<String, Object> updateUser(String userId, Map<String, Object> updates) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }

        User user = userOpt.get();
        applyUserUpdates(user, updates);
        return response("ok", "User updated successfully", toUserProfile(userRepository.save(user)));
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
            return response("error", "User not found", Map.of("id", userId));
        }

        User user = userOpt.get();
        user.setActive(false);
        userRepository.save(user);
        return response("ok", "User deactivated", Map.of("id", user.getId()));
    }

    @Cacheable(value = "userTransactions", key = "#userId + ':' + (#page != null ? #page : '1')")
    @Transactional(readOnly = true)
    public Map<String, Object> userTransactions(String userId, String page) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }

        Page<Transaction> transactions = transactionRepository.findByUserId(userOpt.get().getId(), pageable(page));
        return response("ok", "User transactions fetched",
                paginatedTransactions(transactions, "userId", userOpt.get().getId()));
    }

    @Cacheable(value = "userRecipients", key = "#userId + ':' + (#page != null ? #page : '1')")
    @Transactional(readOnly = true)
    public Map<String, Object> userRecipients(String userId, String page) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }

        Page<Recipient> recipients = recipientService.findByRecipientUserId(userOpt.get().getId(), parsePage(page));
        return response("ok", "User recipients fetched",
                recipientService.paginatedUserResponse(userOpt.get().getId(), recipients));
    }

    @Cacheable(value = "userNotifications", key = "#userId")
    @Transactional(readOnly = true)
    public Map<String, Object> userNotifications(String userId) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }

        Page<Notification> notifications = notificationRepository.findByUserId(userOpt.get().getId(), pageable("1"));
        Map<String, Object> data = paginatedMeta(notifications);
        data.put("userId", userOpt.get().getId());
        data.put("unreadCount", notificationRepository.countByUserIdAndRead(userOpt.get().getId(), false));
        data.put("items", notifications.getContent().stream().map(this::toNotificationView).toList());
        return response("ok", "User notifications fetched", data);
    }

    @Transactional
    public Map<String, Object> changePassword(String userId, String oldPassword, String newPassword) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }
        User user = userOpt.get();
        if (!user.getPasswordHash().equals(oldPassword)) {
            return response("error", "Old password is incorrect", Map.of("id", user.getId()));
        }
        user.setPasswordHash(newPassword);
        userRepository.save(user);
        return response("ok", "Password changed successfully", Map.of("id", user.getId()));
    }

    @CachePut(value = "userProfile", key = "#userId")
    @Transactional
    public Map<String, Object> updateProfilePicture(String userId, String imageUrl) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }
        return response("ok", "Profile picture updated", Map.of("id", userOpt.get().getId(), "avatarUrl", imageUrl));
    }

    @CacheEvict(value = "userNotifications", key = "#userId")
    @Transactional
    public Map<String, Object> markNotificationsAsRead(String userId, List<String> notificationIds) {
        Optional<User> userOpt = resolveUser(userId);
        if (userOpt.isEmpty()) {
            return response("error", "User not found", Map.of("id", userId));
        }

        int updated = notificationIds == null || notificationIds.isEmpty()
                ? notificationRepository.markAllAsRead(userOpt.get().getId())
                : notificationRepository.markAsRead(userOpt.get().getId(), notificationIds);
        return response("ok", "Notifications marked as read", Map.of("updatedCount", updated));
    }

    public Map<String, Object> updateNotificationSettings(String userId, Map<String, Boolean> settings) {
        return response("ok", "Notification preferences updated", Map.of("userId", userId, "settings", settings));
    }

    private Optional<User> resolveUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        if ("me".equalsIgnoreCase(userId)) {
            return userRepository.findByRole(User.Role.GRAHAK).stream().findFirst();
        }
        return userRepository.findById(userId);
    }

    private Map<String, Object> toUserProfile(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", user.getId());
        data.put("name", user.getName());
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("bankName", user.getBankName());
        data.put("accountHolderName", user.getAccountHolderName());
        data.put("accountNumber", user.getAccountNumber());
        data.put("ifscCode", user.getIfscCode());
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
            user.setEmail(stringValue(updates.get("email")));
        }
        if (updates.containsKey("phone")) {
            user.setPhone(stringValue(updates.get("phone")));
        }
        if (updates.containsKey("bankName")) {
            user.setBankName(stringValue(updates.get("bankName")));
        }
        if (updates.containsKey("accountHolderName")) {
            user.setAccountHolderName(stringValue(updates.get("accountHolderName")));
        }
        if (updates.containsKey("accountNumber")) {
            user.setAccountNumber(stringValue(updates.get("accountNumber")));
        }
        if (updates.containsKey("ifscCode")) {
            user.setIfscCode(stringValue(updates.get("ifscCode")));
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

    // public Object userDashboard(String userId, String page) {
    // User user=userRepository.findById(userId).orElse(null);
    // if(user==null){
    // return response("error", "Invalid request", Map.of("id", userId));
    // }

    // }
}
