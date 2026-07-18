package com.growkaro.backend.service;

import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.WithdrawalRequest;
import com.growkaro.backend.repository.RecipientRepository;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.TransactionRepository;
import com.growkaro.backend.repository.WithdrawalRequestRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RemitterAPIService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final RecipientService recipientService;
    private final RemitterRepository remitterRepository;
    private final RecipientRepository recipientRepository;
    private final TransactionRepository transactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;

    public RemitterAPIService(RecipientService recipientService,
            RemitterRepository remitterRepository,
            RecipientRepository recipientRepository,
            TransactionRepository transactionRepository,
            WithdrawalRequestRepository withdrawalRequestRepository) {
        this.recipientService = recipientService;
        this.remitterRepository = remitterRepository;
        this.recipientRepository = recipientRepository;
        this.transactionRepository = transactionRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
    }

    public Map<String, Object> response(String status, String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("data", data != null ? data : Map.of());
        return response;
    }

    @Cacheable(value = "remitterDashboard", key = "#remitterId + ':' + (#range ?: 'default')")
    @Transactional(readOnly = true)
    public Map<String, Object> remitterDashboard(String remitterId, String range) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        if (remitterOpt.isEmpty()) {
            return response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }

        Remitter remitter = remitterOpt.get();
        Page<Transaction> transactions = transactionRepository.findByRemitterId(remitter.getId(), pageable("1"));
        Page<Recipient> recipients = recipientService.findByRemitterId(remitter.getId(), 1);
        Page<WithdrawalRequest> requests = withdrawalRequestRepository.findAll(pageable("1"));
        BigDecimal totalVolume = transactionRepository.sumSuccessfulAmountByRemitter(remitter.getId());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("remitterId", remitter.getId());
        data.put("range", range);
        data.put("dashboardMetrics", Map.of(
                "totalVolume", totalVolume,
                "activeCounterparties", recipientRepository.countByRemitterIdAndActive(remitter.getId(), true)));
        data.put("summary", Map.of(
                "received", totalVolume,
                "pending", withdrawalRequestRepository.sumAmountByStatus(WithdrawalRequest.Status.PENDING)));
        data.put("chartData", transactions.getContent().stream().map(this::toChartPoint).toList());
        data.put("transactions", transactions.getContent().stream().map(this::toTransactionView).toList());
        data.put("recipients", recipients.getContent().stream().map(recipientService::toRemitterView).toList());
        data.put("requests", requests.getContent().stream()
                .filter(request -> request.getRecipient().getRemitter().getId().equals(remitter.getId()))
                .map(this::toRequestView)
                .toList());
        return response("ok", "Remitter dashboard fetched", data);
    }

    @Cacheable(value = "remitterTransactions", key = "#remitterId + ':' + (#page ?: 'default')")
    @Transactional(readOnly = true)
    public Map<String, Object> remitterTransactions(String remitterId, String page) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        if (remitterOpt.isEmpty()) {
            return response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }

        Page<Transaction> transactions = transactionRepository.findByRemitterId(remitterOpt.get().getId(),
                pageable(page));
        Map<String, Object> data = paginatedMeta(transactions);
        data.put("remitterId", remitterOpt.get().getId());
        data.put("items", transactions.getContent().stream().map(this::toTransactionView).toList());
        return response("ok", "Remitter transactions fetched", data);
    }

    @Cacheable(value = "remitterRecipients", key = "#remitterId + ':' + (#page ?: 'default')")
    @Transactional(readOnly = true)
    public Map<String, Object> remitterRecipients(String remitterId, String page) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        if (remitterOpt.isEmpty()) {
            return response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }

        Page<Recipient> recipients = recipientService.findByRemitterId(remitterOpt.get().getId(), parsePage(page));
        return response("ok", "Remitter recipients fetched",
                recipientService.paginatedRemitterResponse(remitterOpt.get().getId(), recipients));
    }

    @Cacheable(value = "paymentRequests", key = "#remitterId + ':' + (#page ?: 'default')")
    @Transactional(readOnly = true)
    public Map<String, Object> paymentRequests(String remitterId, String page) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        if (remitterOpt.isEmpty()) {
            return response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }

        List<Map<String, Object>> items = withdrawalRequestRepository.findAll(pageable(page))
                .getContent()
                .stream()
                .filter(request -> request.getRecipient().getRemitter().getId().equals(remitterOpt.get().getId()))
                .map(this::toRequestView)
                .toList();

        return response("ok", "Payment requests fetched",
                Map.of("remitterId", remitterOpt.get().getId(), "page", parsePage(page), "items", items));
    }

    @CacheEvict(value = { "paymentRequests", "remitterDashboard" }, allEntries = true)
    @Transactional
    public Map<String, Object> settlements(String remitterId, String requestId, Map<String, Object> payload) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        Optional<WithdrawalRequest> requestOpt = withdrawalRequestRepository.findById(requestId);
        if (remitterOpt.isEmpty() || requestOpt.isEmpty()
                || !requestOpt.get().getRecipient().getRemitter().getId().equals(remitterOpt.get().getId())) {
            return response("error", "Payment request not found",
                    Map.of("remitterId", remitterId, "requestId", requestId));
        }

        WithdrawalRequest request = requestOpt.get();
        request.setStatus(WithdrawalRequest.Status.PROCESSED);
        if (payload.containsKey("proofUrl")) {
            request.setProofUrl(stringValue(payload.get("proofUrl")));
        }
        return response("ok", "Settlement submitted", toRequestView(withdrawalRequestRepository.save(request)));
    }

    @CacheEvict(value = { "paymentRequests", "remitterDashboard" }, allEntries = true)
    @Transactional
    public Map<String, Object> proof(String remitterId, String requestId, String fileName) {
        Optional<WithdrawalRequest> requestOpt = withdrawalRequestRepository.findById(requestId);
        if (requestOpt.isEmpty()) {
            return response("error", "Payment request not found", Map.of("requestId", requestId));
        }
        WithdrawalRequest request = requestOpt.get();
        request.setProofUrl(fileName);
        return response("ok", "Proof uploaded", toRequestView(withdrawalRequestRepository.save(request)));
    }

    @CacheEvict(value = { "remitterRecipients", "remitterDashboard" }, allEntries = true)
    @Transactional
    public Map<String, Object> updateRecipient(String remitterId, String recipientId, Map<String, Object> payload) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        if (remitterOpt.isEmpty()) {
            return response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }
        try {
            Optional<Recipient> updated = recipientService.updateForRemitter(remitterOpt.get().getId(), recipientId,
                    payload);
            if (updated.isEmpty()) {
                return response("error", "Recipient not found",
                        Map.of("remitterId", remitterOpt.get().getId(), "recipientId", recipientId));
            }
            return response("ok", "Recipient updated",
                    Map.of("remitterId", remitterOpt.get().getId(), "recipient",
                            recipientService.toRemitterView(updated.get())));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return response("error", ex.getMessage(),
                    Map.of("remitterId", remitterOpt.get().getId(), "recipientId", recipientId));
        }
    }

    @CacheEvict(value = { "remitterRecipients", "remitterDashboard" }, allEntries = true)
    @Transactional
    public Map<String, Object> createRecipient(String remitterId, Map<String, Object> payload) {
        Optional<Remitter> remitterOpt = resolveRemitter(remitterId);
        if (remitterOpt.isEmpty()) {
            return response("error", "Remitter not found", Map.of("remitterId", remitterId));
        }
        try {
            Optional<Recipient> created = recipientService.createForRemitter(remitterOpt.get().getId(), payload);
            if (created.isEmpty()) {
                return response("error", "Recipient user not found", Map.of("remitterId", remitterOpt.get().getId()));
            }
            return response("ok", "Recipient created",
                    Map.of("remitterId", remitterOpt.get().getId(), "recipient",
                            recipientService.toRemitterView(created.get())));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return response("error", ex.getMessage(), Map.of("remitterId", remitterOpt.get().getId()));
        }
    }

    private Optional<Remitter> resolveRemitter(String remitterId) {
        if (remitterId == null || remitterId.isBlank()) {
            return Optional.empty();
        }
        if ("me".equalsIgnoreCase(remitterId)) {
            return remitterRepository.findAll().stream().findFirst();
        }
        return remitterRepository.findById(remitterId);
    }

    private Map<String, Object> toTransactionView(Transaction transaction) {
        Map<String, Object> data = new LinkedHashMap<>();
        String recipientName = transaction.getRecipient() != null ? transaction.getRecipient().getName() : "Recipient";
        data.put("id", transaction.getId());
        data.put("name", recipientName);
        data.put("method", transaction.getRecipient() != null && transaction.getRecipient().getUpiId() != null
                ? "UPI"
                : "Bank Transfer");
        data.put("amount", transaction.getAmount());
        data.put("foreign", transaction.getAmount());
        data.put("status", transaction.getStatus().name());
        data.put("date", transaction.getCreatedAt());
        data.put("remarks", transaction.getRemarks());
        data.put("referenceId", transaction.getReferenceId());
        data.put("color", "blue");
        return data;
    }

    private Map<String, Object> toChartPoint(Transaction transaction) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        return Map.of(
                "date", formatter.format(transaction.getCreatedAt()),
                "amount", transaction.getAmount(),
                "x", 0,
                "y", 0);
    }

    private Map<String, Object> toRequestView(WithdrawalRequest request) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", request.getId());
        data.put("sender", request.getUser().getName());
        data.put("note", request.getAdminNote() != null ? request.getAdminNote() : "Withdrawal request");
        data.put("amount", request.getAmount());
        data.put("date", request.getCreatedAt());
        data.put("status", request.getStatus().name());
        data.put("isSettled", request.getStatus() == WithdrawalRequest.Status.PROCESSED);
        data.put("proofUrl", request.getProofUrl());
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
