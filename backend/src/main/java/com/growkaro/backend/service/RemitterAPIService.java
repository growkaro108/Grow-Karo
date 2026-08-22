package com.growkaro.backend.service;

import com.growkaro.backend.DRO.PaymentSettlement;
import com.growkaro.backend.DTO.Payee;
import com.growkaro.backend.DTO.RemitterResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.enums.ActivityType;
import com.growkaro.backend.entity.Transaction.TransactionStatus;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.NotificationContentBuilder;
import com.growkaro.backend.entity.Notification.ReceiverType;
import com.growkaro.backend.repository.NotificationRepository;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RemitterAPIService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final RemitterRepository remitterRepository;
    private final EmailService emailService;
    private final ApiService apiService;
    private final General general;
    private final ActivityLogService activityLogService;
    private final TransactionRepository transactionRepository;
    private final LocalFileStorageService localFileStorageService;
    private final NotificationRepository notificationRepository;
    private final CrucialNotificationService crucialNotificationService;
    private final NotificationContentBuilder notificationContentBuilder;

    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of("application/pdf", "image/jpeg", "image/png",
            "image/webp");
    private static final long MAX_DOCUMENT_SIZE_BYTES = 3 * 1024 * 1024; // 3MB in bytes

    public RemitterAPIService(
            RemitterRepository remitterRepository,
            EmailService emailService,
            ApiService apiService,
            General general,
            ActivityLogService activityLogService,
            TransactionRepository transactionRepository,
            LocalFileStorageService localFileStorageService,
            NotificationRepository notificationRepository,
            CrucialNotificationService crucialNotificationService,
            NotificationContentBuilder notificationContentBuilder) {
        this.remitterRepository = remitterRepository;
        this.emailService = emailService;
        this.apiService = apiService;
        this.general = general;
        this.activityLogService = activityLogService;
        this.transactionRepository = transactionRepository;
        this.localFileStorageService = localFileStorageService;
        this.notificationRepository = notificationRepository;
        this.crucialNotificationService = crucialNotificationService;
        this.notificationContentBuilder = notificationContentBuilder;
    }

    public boolean isRemitterExists(String email) {
        return remitterRepository.findByRemitterEmail(email).isPresent();
    }

    private Remitter findByEmail(String email) {
        Optional<Remitter> remitterOpt = remitterRepository.findByRemitterEmail(email);
        return remitterOpt.isPresent() ? remitterOpt.get() : null;
    }

    private Remitter findById(String remitterId) {
        Optional<Remitter> remitterOpt = remitterRepository.findByRemitterId(remitterId);
        return remitterOpt.isPresent() ? remitterOpt.get() : null;
    }

    public RemitterResponse login(String email, String password) {
        try {
            Remitter remitter = findByEmail(email);
            if (remitter == null || password == null || !BCrypt.checkpw(password, remitter.getPassword())) {
                return null;
            }
            return RemitterResponse.fromEntity(remitter);
        } catch (Exception e) {
            log.error("Error in login : email=" + email + " error:" + e.getMessage());
            return null;
        }
    }

    // forgot password
    public String forgotPassword(String remitterEmail) {
        Remitter remitter = findByEmail(remitterEmail);
        if (remitter == null) {
            return "Invalid Email... ";
        }
        emailService.sendResetLinkToRemitter(remitter.getRemitterEmail(), remitter.getRemitterId());
        return "OTP sent successfully";
    }

    public boolean resetPassword(String remitterId, String newPassword) {
        Remitter remitterOpt = findById(remitterId);
        if (remitterOpt == null) {
            return false;
        }
        Remitter remitter = remitterOpt;
        remitter.setPassword(apiService.makePasswordHash(newPassword));
        remitterRepository.save(remitter);
        crucialNotificationService.notifyRemitter(
                NotificationContentBuilder.EssentialActionType.PASSWORD_CHANGED,
                remitter,
                "/remitter/login",
                null);
        return true;
    }

    public Map<String, Long> txnCounts(String remitterId) {
        try {
            Remitter remitter = findById(remitterId);
            if (remitter == null) {
                return null;
            }

            Map<String, Long> counts = new LinkedHashMap<>();
            counts.put("success", transactionRepository.countByRemitter_RemitterIdAndStatus(remitter.getRemitterId(),
                    TransactionStatus.SUCCESS));
            counts.put("processed", transactionRepository.countByRemitter_RemitterIdAndStatus(remitter.getRemitterId(),
                    TransactionStatus.PROCESSED));
            return counts;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Payee> pendingPayments(String remitterId) {

        try {
            List<Transaction> pendingRequests = transactionRepository.findAllByRemitter_RemitterIdAndStatus(remitterId,
                    TransactionStatus.PROCESSED);

            return pendingRequests.stream().map(general::toPayee).toList();
        } catch (Exception e) {
            log.error("Error in pendingPayments : remitterId=" + remitterId + " error:" + e.getMessage());
            return null;
        }
    }

    public String settlements(PaymentSettlement paymentSettlement) {
        try {

            Transaction transaction = transactionRepository.findById(paymentSettlement.txnId()).orElse(null);
            if (transaction == null // check is valid transaction id
                    || !transaction.getRemitter().getRemitterId().equals(paymentSettlement.remitterId()) // check is
                                                                                                         // valid
                                                                                                         // remitter
                    || transaction.getStatus() != TransactionStatus.PROCESSED // check is valid status
                    || transaction.getAmount().compareTo(paymentSettlement.amount()) != 0) { // check is valid amount
                log.error("Error in remitter settlements: remitterId {}", paymentSettlement.remitterId());
                return null;
            }
            // validate file
            if (paymentSettlement.file() == null || paymentSettlement.file().isEmpty() // check is valid file
                    || !ALLOWED_DOCUMENT_TYPES.contains(paymentSettlement.file().getContentType()) // check is valid
                                                                                                   // file type
                    || paymentSettlement.file().getSize() > MAX_DOCUMENT_SIZE_BYTES) { // check is valid file size
                log.error("Error in remitter settlements: remitterId {}", paymentSettlement.remitterId());
                return null;
            }
            Remitter remitter = transaction.getRemitter();
            BigDecimal remitterCurrentBalance = remitter.getTotalPaid();

            User user = transaction.getUser();
            Set<User> users = remitter.getUsers();
            if (users == null) {
                users = new HashSet<>();
            }
            users.add(user);

            String uploadedUrl = localFileStorageService.store(paymentSettlement.file(),
                    "settlements/" + paymentSettlement.txnId());
            if (uploadedUrl == null || uploadedUrl.isEmpty()) {
                log.error("Error in remitter settlements: remitterId {}", paymentSettlement.remitterId());
                return null;
            }
            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setProofUrl(uploadedUrl);
            transaction.setSettlementDate(general.getCurrentDateTime());
            transactionRepository.save(transaction);
            if (!users.contains(user)) {
                remitter.setUsers(users);
            }
            remitter.setTotalPaid(remitterCurrentBalance.add(transaction.getAmount()));
            remitterRepository.save(remitter);

            crucialNotificationService.notifyAllForEssentialAction(
                    NotificationContentBuilder.EssentialActionType.WITHDRAWAL_DISBURSED,
                    user,
                    List.of(),
                    remitter,
                    "/dashboard/transactions",
                    Map.of("amount", paymentSettlement.amount().toString(), "txnId", transaction.getId()));

            return uploadedUrl;
        } catch (Exception e) {
            log.error("Error in remitter settlements: remitterId {} because {}", paymentSettlement.remitterId(),
                    e.getMessage());
            return null;
        }
    }

    public Page<Payee> getRemitterTransactions(String remitterId, Pageable pageable) {
        try {
            Remitter remitter = findById(remitterId);
            if (remitter == null) {
                return null;
            }
            Page<Transaction> transactionPage = transactionRepository.findByRemitter_RemitterId(remitterId, pageable);
            return transactionPage.map(general::toPayee);
        } catch (Exception e) {
            log.error("Error in remitter transactions: remitterId {} because {}", remitterId, e.getMessage());
            return null;
        }
    }

    public List<Recipient> getRecipient(String remitterId) {
        Remitter remitter = findById(remitterId);
        if (remitter == null) {
            log.warn("No remitter found for remitterId {}", remitterId);
            return List.of();
        }

        try {
            List<Transaction> transactions = transactionRepository
                    .findAllByRemitter_RemitterId(remitter.getRemitterId());

            // group by user, preserving encounter order (newest-first, since the
            // query is ORDER BY transactionDate DESC) — so the first transaction
            // seen for each user is their most recent one.
            Map<String, List<Transaction>> byUser = transactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getUser().getId(),
                            LinkedHashMap::new,
                            Collectors.toList()));

            return byUser.values().stream()
                    .map(general::toRecipient) // updated signature below: List<Transaction> -> Recipient
                    .toList();

        } catch (Exception e) {
            log.error("Error fetching remitter recipients: remitterId {} because {}", remitterId, e.getMessage());
            return List.of();
        }
    }

    public boolean logoutRemitter(String remitterId, String remitterCode) {
        try {
            Remitter remitter = findById(remitterId);
            if (remitter == null) {
                log.error("Error in remitter logout: remitterId {}", remitterId);
                return false;
            }
            activityLogService.log(
                    remitterId, remitterCode, "USER",
                    ActivityType.LOGOUT,
                    remitterCode + " logged out",
                    "USER", "",
                    Map.of());
            return true;
        } catch (Exception e) {
            log.error("Error in remitter logout: remitterId {}", remitterId);
            return false;
        }
    }

    // @Cacheable(value = "remitterDashboard", key = "#remitterId + ':' + (#range ?:
    // 'default')")
    // @Transactional(readOnly = true)
    // public Map<String, Object> remitterDashboard(String remitterId, String range)
    // {
    // Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
    // if (remitterOpt.isEmpty()) {
    // return response("error", "Remitter not found", Map.of("remitterId",
    // remitterId));
    // }

    // Remitter remitter = remitterOpt.get();
    // Page<Transaction> transactions =
    // transactionRepository.findByRemitterId(remitter.getRemitterId(),
    // pageable("1"));
    // Page<Recipient> recipients =
    // recipientService.findByRemitterId(remitter.getRemitterId(), 1);
    // Page<WithdrawalRequest> requests =
    // withdrawalRequestRepository.findAll(pageable("1"));
    // BigDecimal totalVolume =
    // transactionRepository.sumSuccessfulAmountByRemitter(remitter.getRemitterId());

    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("remitterId", remitter.getRemitterId());
    // data.put("range", range);
    // data.put("dashboardMetrics", Map.of(
    // "totalVolume", totalVolume,
    // "activeCounterparties",
    // recipientRepository.countByRemitterIdAndActive(remitter.getRemitterId(),
    // true)));
    // data.put("summary", Map.of(
    // "received", totalVolume,
    // "pending",
    // withdrawalRequestRepository.sumAmountByStatus(WithdrawalStatus.PENDING)));
    // data.put("chartData",
    // transactions.getContent().stream().map(this::toChartPoint).toList());
    // data.put("transactions",
    // transactions.getContent().stream().map(this::toTransactionView).toList());
    // data.put("recipients",
    // recipients.getContent().stream().map(recipientService::toRemitterView).toList());
    // data.put("requests", requests.getContent().stream()
    // .filter(request ->
    // request.getRecipient().getRemitter().getRemitterId().equals(remitter.getRemitterId()))
    // .map(this::toRequestView)
    // .toList());
    // return response("ok", "Remitter dashboard fetched", data);
    // }

    // @Cacheable(value = "remitterTransactions", key = "#remitterId + ':' + (#page
    // ?: 'default')")
    // @Transactional(readOnly = true)
    // public Map<String, Object> remitterTransactions(String remitterId, String
    // page) {
    // Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
    // if (remitterOpt.isEmpty()) {
    // return response("error", "Remitter not found", Map.of("remitterId",
    // remitterId));
    // }

    // Page<Transaction> transactions =
    // transactionRepository.findByRemitterId(remitterOpt.get().getRemitterId(),
    // pageable(page));
    // Map<String, Object> data = paginatedMeta(transactions);
    // data.put("remitterId", remitterOpt.get().getRemitterId());
    // data.put("items",
    // transactions.getContent().stream().map(this::toTransactionView).toList());
    // return response("ok", "Remitter transactions fetched", data);
    // }

    // @Cacheable(value = "paymentRequests", key = "#remitterId + ':' + (#page ?:
    // 'default')")
    // @Transactional(readOnly = true)
    // public Map<String, Object> paymentRequests(String remitterId, String page) {
    // Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
    // if (remitterOpt.isEmpty()) {
    // return response("error", "Remitter not found", Map.of("remitterId",
    // remitterId));
    // }

    // List<Map<String, Object>> items =
    // withdrawalRequestRepository.findAll(pageable(page))
    // .getContent()
    // .stream()
    // .filter(request -> request.getRecipient().getRemitter().getRemitterId()
    // .equals(remitterOpt.get().getRemitterId()))
    // .map(this::toRequestView)
    // .toList();

    // return response("ok", "Payment requests fetched",
    // Map.of("remitterId", remitterOpt.get().getRemitterId(), "page",
    // parsePage(page), "items", items));
    // }

    // @CacheEvict(value = { "paymentRequests", "remitterDashboard" }, allEntries =
    // true)
    // @Transactional
    // public Map<String, Object> settlements(String remitterId, String requestId,
    // Map<String, Object> payload) {
    // Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
    // Optional<WithdrawalRequest> requestOpt =
    // withdrawalRequestRepository.findById(requestId);
    // if (remitterOpt.isEmpty() || requestOpt.isEmpty()
    // || !requestOpt.get().getRecipient().getRemitter().getRemitterId()
    // .equals(remitterOpt.get().getRemitterId())) {
    // return response("error", "Payment request not found",
    // Map.of("remitterId", remitterId, "requestId", requestId));
    // }

    // WithdrawalRequest request = requestOpt.get();
    // request.setStatus(WithdrawalStatus.PROCESSED);
    // if (payload.containsKey("proofUrl")) {
    // request.setProofUrl(stringValue(payload.get("proofUrl")));
    // }
    // return response("ok", "Settlement submitted",
    // toRequestView(withdrawalRequestRepository.save(request)));
    // }

    // @CacheEvict(value = { "paymentRequests", "remitterDashboard" }, allEntries =
    // true)
    // @Transactional
    // public Map<String, Object> proof(String remitterId, String requestId, String
    // fileName) {
    // Optional<WithdrawalRequest> requestOpt =
    // withdrawalRequestRepository.findById(requestId);
    // if (requestOpt.isEmpty()) {
    // return response("error", "Payment request not found", Map.of("requestId",
    // requestId));
    // }
    // WithdrawalRequest request = requestOpt.get();
    // request.setProofUrl(fileName);
    // return response("ok", "Proof uploaded",
    // toRequestView(withdrawalRequestRepository.save(request)));
    // }

    private Optional<Remitter> resolveRemitter(String remitterId) {
        if (remitterId == null || remitterId.isBlank()) {
            return Optional.empty();
        }
        if ("me".equalsIgnoreCase(remitterId)) {
            return remitterRepository.findAll().stream().findFirst();
        }
        return remitterRepository.findById(remitterId);
    }

    // private Map<String, Object> toTransactionView(Transaction transaction) {
    // Map<String, Object> data = new LinkedHashMap<>();
    // String recipientName = transaction.getRecipient() != null ?
    // transaction.getRecipient().getName() : "Recipient";
    // data.put("id", transaction.getRemitterId());
    // data.put("name", recipientName);
    // data.put("method", transaction.getRecipient() != null &&
    // transaction.getRecipient().getUpiId() != null
    // ? "UPI"
    // : "Bank Transfer");
    // data.put("amount", transaction.getAmount());
    // data.put("foreign", transaction.getAmount());
    // data.put("status", transaction.getStatus().name());
    // data.put("date", transaction.getCreatedAt());
    // data.put("remarks", transaction.getRemarks());
    // data.put("referenceId", transaction.getReferenceId());
    // data.put("color", "blue");
    // return data;
    // }

    private Map<String, Object> toChartPoint(Transaction transaction) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        return Map.of(
                "date", formatter.format(transaction.getCreatedAt()),
                "amount", transaction.getAmount(),
                "x", 0,
                "y", 0);
    }

    // private Map<String, Object> toRequestView(WithdrawalRequest request) {
    // Map<String, Object> data = new LinkedHashMap<>();
    // data.put("id", request.getRemitterId());
    // data.put("sender", request.getUser().getName());
    // data.put("note", request.getAdminNote() != null ? request.getAdminNote() :
    // "Withdrawal request");
    // data.put("amount", request.getAmount());
    // data.put("date", request.getCreatedAt());
    // data.put("status", request.getStatus().name());
    // data.put("isSettled", request.getStatus() == WithdrawalStatus.PROCESSED);
    // data.put("proofUrl", request.getProofUrl());
    // return data;
    // }

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

    @Transactional(readOnly = true)
    public Map<String, Object> getRemitterNotifications(String remitterId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(Math.max(0, page - 1), size > 0 ? size : DEFAULT_PAGE_SIZE,
                    Sort.by("createdAt").descending());
            Page<Notification> result = notificationRepository.findByReceiverIdAndReceiverType(
                    remitterId, ReceiverType.Remitter, pageable);
            long unreadCount = notificationRepository.countByReceiverIdAndReceiverTypeAndRead(
                    remitterId, ReceiverType.Remitter, false);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("currentPage", page);
            data.put("totalPages", result.getTotalPages());
            data.put("totalItems", result.getTotalElements());
            data.put("unreadCount", unreadCount);
            data.put("items", result.getContent().stream().map(this::toRemitterNotificationView).toList());
            return general.response("success", "Remitter notifications fetched", data);
        } catch (Exception e) {
            log.error("Error in fetching remitter notifications: {}", e.getMessage());
            return general.response("error", "Something went wrong..", Map.of("error", e.getMessage()));
        }
    }

    @Transactional
    public Map<String, Object> markRemitterNotificationsAsRead(String remitterId, List<String> notificationIds) {
        int updated = (notificationIds == null || notificationIds.isEmpty())
                ? notificationRepository.markAllAsRead(remitterId, ReceiverType.Remitter)
                : notificationRepository.markAsRead(remitterId, ReceiverType.Remitter, notificationIds);
        return general.response("ok", "Remitter notifications marked as read", Map.of("updatedCount", updated));
    }

    private Map<String, Object> toRemitterNotificationView(Notification n) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", n.getId());
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
}
