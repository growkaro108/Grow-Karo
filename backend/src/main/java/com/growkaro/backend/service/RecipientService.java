package com.growkaro.backend.service;

import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.repository.RecipientRepository;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RecipientService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final RecipientRepository recipientRepository;
    private final RemitterRepository remitterRepository;
    private final UserRepository userRepository;

    public RecipientService(RecipientRepository recipientRepository,
                            RemitterRepository remitterRepository,
                            UserRepository userRepository) {
        this.recipientRepository = recipientRepository;
        this.remitterRepository = remitterRepository;
        this.userRepository = userRepository;
    }

    public Page<Recipient> findByRemitterId(String remitterId, int page) {
        return recipientRepository.findByRemitterIdAndActive(
                remitterId, true, pageable(page));
    }

    public Page<Recipient> findByRecipientUserId(String userId, int page) {
        return recipientRepository.findByUserIdAndActive(
                userId, true, pageable(page));
    }

    public Optional<Recipient> findByIdAndRemitterId(String recipientId, String remitterId) {
        return recipientRepository.findByIdAndRemitterId(recipientId, remitterId);
    }

    @Transactional
    public Optional<Recipient> createForRemitter(String remitterId, Map<String, Object> payload) {
        Optional<Remitter> remitterOpt = remitterRepository.findById(remitterId);
        if (remitterOpt.isEmpty()) {
            return Optional.empty();
        }

        String recipientUserId = stringValue(payload.get("userId"));
        if (recipientUserId == null) {
            return Optional.empty();
        }

        Optional<User> recipientUserOpt = userRepository.findById(recipientUserId);
        if (recipientUserOpt.isEmpty()) {
            return Optional.empty();
        }

        if (recipientRepository.existsByRemitterIdAndUserId(remitterId, recipientUserId)) {
            throw new IllegalStateException("Recipient user already exists for this remitter");
        }

        String accountNumber = stringValue(payload.get("accountNumber"));
        if (accountNumber != null
                && recipientRepository.existsByRemitterIdAndAccountNumber(remitterId, accountNumber)) {
            throw new IllegalStateException("Account number already exists for this remitter");
        }

        String upiId = stringValue(payload.get("upiId"));
        if (upiId != null && recipientRepository.existsByRemitterIdAndUpiId(remitterId, upiId)) {
            throw new IllegalStateException("UPI ID already exists for this remitter");
        }

        Recipient recipient = new Recipient();
        recipient.setRemitter(remitterOpt.get());
        recipient.setUser(recipientUserOpt.get());
        applyPayload(recipient, payload, true);

        if (recipient.getName() == null || recipient.getAccountNumber() == null
                || recipient.getIfscCode() == null) {
            throw new IllegalArgumentException("name, accountNumber, and ifscCode are required");
        }

        return Optional.of(recipientRepository.save(recipient));
    }

    @Transactional
    public Optional<Recipient> updateForRemitter(String remitterId, String recipientId,
                                                 Map<String, Object> payload) {
        Optional<Recipient> recipientOpt = recipientRepository.findByIdAndRemitterId(recipientId, remitterId);
        if (recipientOpt.isEmpty()) {
            return Optional.empty();
        }

        Recipient recipient = recipientOpt.get();

        String accountNumber = stringValue(payload.get("accountNumber"));
        if (accountNumber != null
                && !accountNumber.equals(recipient.getAccountNumber())
                && recipientRepository.existsByRemitterIdAndAccountNumber(remitterId, accountNumber)) {
            throw new IllegalStateException("Account number already exists for this remitter");
        }

        String upiId = stringValue(payload.get("upiId"));
        if (upiId != null
                && !upiId.equals(recipient.getUpiId())
                && recipientRepository.existsByRemitterIdAndUpiId(remitterId, upiId)) {
            throw new IllegalStateException("UPI ID already exists for this remitter");
        }

        applyPayload(recipient, payload, false);
        return Optional.of(recipientRepository.save(recipient));
    }

    public Map<String, Object> toRemitterView(Recipient recipient) {
        Map<String, Object> item = baseFields(recipient);
        item.put("userId", recipient.getUser().getId());
        item.put("initial", initials(recipient.getName()));
        item.put("details", formatDetails(recipient));
        return item;
    }

    public Map<String, Object> toUserView(Recipient recipient) {
        Map<String, Object> item = baseFields(recipient);
        item.put("remitterId", recipient.getRemitter().getId());
        item.put("remitterName", recipient.getRemitter().getOrganizationName());
        item.put("details", formatDetails(recipient));
        return item;
    }

    public Map<String, Object> paginatedRemitterResponse(String remitterId, Page<Recipient> page) {
        Map<String, Object> data = paginatedMeta(remitterId, null, page);
        data.put("items", page.getContent().stream().map(this::toRemitterView).toList());
        return data;
    }

    public Map<String, Object> paginatedUserResponse(String userId, Page<Recipient> page) {
        Map<String, Object> data = paginatedMeta(null, userId, page);
        data.put("items", page.getContent().stream().map(this::toUserView).toList());
        return data;
    }

    private Map<String, Object> baseFields(Recipient recipient) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", recipient.getId());
        item.put("name", recipient.getName());
        item.put("accountNumber", maskAccountNumber(recipient.getAccountNumber()));
        item.put("ifscCode", recipient.getIfscCode());
        item.put("bankName", recipient.getBankName());
        item.put("upiId", recipient.getUpiId());
        item.put("active", recipient.isActive());
        item.put("createdAt", recipient.getCreatedAt());
        item.put("updatedAt", recipient.getUpdatedAt());
        return item;
    }

    private Map<String, Object> paginatedMeta(String remitterId, String userId, Page<Recipient> page) {
        Map<String, Object> data = new LinkedHashMap<>();
        if (remitterId != null) {
            data.put("remitterId", remitterId);
        }
        if (userId != null) {
            data.put("userId", userId);
        }
        data.put("currentPage", page.getNumber() + 1);
        data.put("totalPages", page.getTotalPages());
        data.put("totalItems", page.getTotalElements());
        return data;
    }

    private void applyPayload(Recipient recipient, Map<String, Object> payload, boolean creating) {
        if (payload.containsKey("name")) {
            recipient.setName(stringValue(payload.get("name")));
        } else if (creating && recipient.getUser() != null) {
            recipient.setName(recipient.getUser().getName());
        }

        if (payload.containsKey("accountNumber")) {
            recipient.setAccountNumber(stringValue(payload.get("accountNumber")));
        }
        if (payload.containsKey("ifscCode")) {
            recipient.setIfscCode(stringValue(payload.get("ifscCode")));
        }
        if (payload.containsKey("bankName")) {
            recipient.setBankName(stringValue(payload.get("bankName")));
        }
        if (payload.containsKey("upiId")) {
            recipient.setUpiId(stringValue(payload.get("upiId")));
        }
        if (payload.containsKey("active")) {
            recipient.setActive(booleanValue(payload.get("active")));
        }
    }

    private Pageable pageable(int page) {
        int safePage = Math.max(page, 1) - 1;
        return PageRequest.of(safePage, DEFAULT_PAGE_SIZE);
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private boolean booleanValue(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() <= 4) {
            return accountNumber;
        }
        return "XXXX" + accountNumber.substring(accountNumber.length() - 4);
    }

    private String formatDetails(Recipient recipient) {
        if (recipient.getUpiId() != null && !recipient.getUpiId().isBlank()) {
            return "UPI • " + recipient.getUpiId();
        }
        String bank = recipient.getBankName() != null ? recipient.getBankName() : "Bank";
        return bank + " • " + maskAccountNumber(recipient.getAccountNumber());
    }

    private String initials(String name) {
        if (name == null || name.isBlank()) {
            return "?";
        }
        List<String> parts = List.of(name.trim().split("\\s+"));
        if (parts.size() == 1) {
            return parts.get(0).substring(0, 1).toUpperCase();
        }
        return (parts.get(0).substring(0, 1) + parts.get(1).substring(0, 1)).toUpperCase();
    }
}
