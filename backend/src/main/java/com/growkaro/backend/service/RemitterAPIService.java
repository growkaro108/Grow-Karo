package com.growkaro.backend.service;

import com.growkaro.backend.DTO.Payee;
import com.growkaro.backend.DTO.RemitterResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.WithdrawalRequest;
import com.growkaro.backend.entity.Transaction.TransactionStatus;
import com.growkaro.backend.enums.WithdrawalStatus;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.WithdrawalRequestRepository;

import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.SystemPropertyCredentialsProvider;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class RemitterAPIService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final RemitterRepository remitterRepository;
    private final EmailService emailService;
    private final ApiService apiService;
    private final General general;
    private final TransactionRepository transactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;

    public RemitterAPIService(
            RemitterRepository remitterRepository,
            EmailService emailService,
            ApiService apiService,
            General general,
            TransactionRepository transactionRepository,
            WithdrawalRequestRepository withdrawalRequestRepository) {
        this.remitterRepository = remitterRepository;
        this.emailService = emailService;
        this.apiService = apiService;
        this.general = general;
        this.transactionRepository = transactionRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
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
}
