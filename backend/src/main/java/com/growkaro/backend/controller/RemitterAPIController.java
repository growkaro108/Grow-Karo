package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.growkaro.backend.DRO.PaymentSettlement;
import com.growkaro.backend.DTO.PagedResponse;
import com.growkaro.backend.DTO.Payee;
import com.growkaro.backend.DTO.RemitterResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.common.NotificationBroadcaster;
import com.growkaro.backend.entity.Notification.ReceiverType;
import com.growkaro.backend.entity.Recipient;
import com.growkaro.backend.service.RemitterAPIService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({ "/api/remitter", "/api/remitters" })
public class RemitterAPIController {

    private final RemitterAPIService remitterAPIService;
    private final General general;
    private final NotificationBroadcaster notificationBroadcaster;

    public RemitterAPIController(RemitterAPIService remitterAPIService, General general,
            NotificationBroadcaster notificationBroadcaster) {
        this.remitterAPIService = remitterAPIService;
        this.general = general;
        this.notificationBroadcaster = notificationBroadcaster;
    }

    @PostMapping("/login")
    private Map<String, Object> login(@RequestBody Map<String, Object> credentials) {
        String email = general.stringValue(credentials.get("email"));
        String password = general.stringValue(credentials.get("password"));
        String role = general.stringValue(credentials.get("role"));
        try {
            if (password == null || password.isEmpty() || email == null || email.isEmpty() || role == null
                    || role.isEmpty() || !role.equals("remiter") || !general.validateEmail(email)
                    || !general.validatePassword(password)) {
                log.info("Invalid request: email {} role {}", email, role);
                return general.response("info", "Invalid request", null);
            }
            RemitterResponse rr = remitterAPIService.login(email, password);
            if (rr != null) {
                if (!rr.isStatus()) {
                    return general.response("info", "Account is not active", null);
                }
                return general.response("success", "Login successful", rr);
            } else {
                log.info("Invalid credentials: email {} role {}", email, role);
                return general.response("error", "Invalid credentials...", null);
            }
        } catch (Exception e) {
            log.error("Error in remitter login: email {} role {} because {} ", email, role, e.getMessage());
            return general.response("error", "Something went wrong..", null);
        }
    }

    @PostMapping("/forgot-password/{email}")
    public Map<String, Object> forgotPassword(@PathVariable String email) {
        try {

            if (email == null || email.isEmpty()) {
                return general.response("error", "Invalid request", null);
            }
            String message = remitterAPIService.forgotPassword(email);
            if (message != null) {
                return general.response("success", message, null);
            } else {
                return general.response("error", "Something went wrong..", null);
            }
        } catch (Exception e) {
            log.error("Error in remitter forgot password: email {} because {} ", email, e.getMessage());
            return general.response("error", "Something went wrong..", null);
        }
    }

    @PatchMapping("/reset-password/{remitterId}")
    public Map<String, Object> resetPassword(@PathVariable String remitterId, @RequestBody Map<String, String> body) {
        String passWord = body.get("password");

        try {
            if (remitterId == null || remitterId.isEmpty() || passWord == null || !general.validatePassword(passWord)) {
                return general.response("info", "Invalid request", null);
            }
            boolean success = remitterAPIService.resetPassword(remitterId, passWord);
            if (success) {
                return general.response("success", "Password reset successful", null);
            } else {
                return general.response("error", "Something went wrong..", null);
            }
        } catch (Exception e) {
            log.error("Error in remitter reset password: remitterId {} because {} ",
                    remitterId, e.getMessage());
            return general.response("error", "Something went wrong..", null);
        }
    }

    @GetMapping("/{remitterId}/txncounts")
    public Map<String, Object> getAllTransactionCounts(@PathVariable String remitterId) {
        try {
            if (remitterId == null || remitterId.isEmpty()) {
                return general.response("error", "Invalid request", null);
            }
            Map<String, Long> txnCounts = remitterAPIService.txnCounts(remitterId);
            return general.response("success", "Transaction counts fetched successfully", txnCounts);
        } catch (Exception e) {
            log.error("Error in remitter transactions: remitterId {} because {}", remitterId, e.getMessage());
            return general.response("error", "Something went wrong..", null);
        }
    }

    @GetMapping("/{remitterId}/pending-payments")
    public Map<String, Object> PaymentRequests(@PathVariable String remitterId) {
        try {
            if (remitterId == null || remitterId.isEmpty()) {
                log.info("Invalid request: remitterId {}", remitterId);
                return general.response("error", "Invalid request", null);
            }
            List<Payee> payees = remitterAPIService.pendingPayments(remitterId);
            if (payees == null) {
                return general.response("error", "Payee not found", null);
            }
            return general.response("success", "Payee fetched successfully", payees);
        } catch (Exception e) {
            log.error("Error in remitter payees: remitterId {} because {}", remitterId, e.getMessage());
            return general.response("error", "Something went wrong..", null);
        }
    }

    @PostMapping("/settlements")
    public Map<String, Object> settlements(@ModelAttribute PaymentSettlement paymentSettlement) {
        try {
            if (paymentSettlement.remitterId() == null || paymentSettlement.remitterId().isEmpty()) {
                log.info("Invalid request: remitterId {}", paymentSettlement.remitterId());
                return general.response("error", "Invalid request", null);
            }
            String success = remitterAPIService.settlements(paymentSettlement);
            if (success != null) {
                return general.response("success", "Settlement submitted successfully", success);
            } else {
                return general.response("error", "Something went wrong..", null);
            }
        } catch (Exception e) {
            log.error("Error in remitter settlements: remitterId {} because {}", paymentSettlement.remitterId(),
                    e.getMessage());
            return general.response("error", "Internal server error..", null);
        }
    }

    @GetMapping("/{remitterId}/transactions")
    public Map<String, Object> getRemitterTransactions(
            @PathVariable String remitterId,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            if (remitterId == null || remitterId.isEmpty() || limit <= 0 || limit > 10 || offset < 0) {
                log.info("Invalid request: remitterId {} limit {} offset {}", remitterId, limit, offset);
                return general.response("error", "Invalid request", null);
            }

            int pageNumber = offset / limit;
            Pageable pageable = PageRequest.of(pageNumber, limit, Sort.by("createdAt").descending());

            Page<Payee> transactionPage = remitterAPIService.getRemitterTransactions(remitterId, pageable);
            if (transactionPage == null) {
                return general.response("error", "Transactions not found", null);
            }

            PagedResponse<Payee> pagedResponse = PagedResponse.from(transactionPage, offset, limit);
            return general.response("success", "Transactions fetched successfully", pagedResponse);
        } catch (Exception e) {
            log.error("Error in remitter transactions: remitterId {} because {}", remitterId, e.getMessage());
            return general.response("error", "Internal server error..", null);
        }
    }

    @GetMapping("/{remitterId}/recipients")
    public Map<String, Object> getRecipient(@PathVariable String remitterId) {
        try {
            if (remitterId == null || remitterId.isEmpty()) {
                log.info("Invalid request: remitterId {}", remitterId);
                return general.response("error", "Invalid request", null);
            }
            List<Recipient> recipients = remitterAPIService.getRecipient(remitterId);
            if (recipients == null) {
                return general.response("error", "Recipients not found", null);
            }
            return general.response("success", "Recipients fetched successfully", recipients);
        } catch (Exception e) {
            log.error("Error in remitter recipients: remitterId {} because {}", remitterId, e.getMessage());
            return general.response("error", "Internal server error..", null);
        }
    }

    @GetMapping("/logout")
    public boolean logout(@RequestParam String remitterId, @RequestParam String remitterCode) {
        return remitterAPIService.logoutRemitter(remitterId, remitterCode);
    }

    @GetMapping("/{remitterId}/timeline")
    public Map<String, Object> PaymentTimeLine(@PathVariable String remitterId) {
        try {
            // i want date and amount on what date transfer hw much amount
            List<Map<String, Object>> paymentTimeLine = remitterAPIService.paymentTimeLine(remitterId);
            if (paymentTimeLine == null) {
                return general.response("error", "Payment timeline not found", null);
            }
            return general.response("success", "Payment timeline fetched successfully",
                    paymentTimeLine);
        } catch (Exception e) {
            log.error("Error in remitter dashboard: remitterId {} because {}",
                    remitterId, e.getMessage());
            return general.response("error", "Internal server error..", null);
        }
    }

    // @GetMapping("/{remitterId}/transactions")
    // public ResponseEntity<Map<String, Object>> remitterTransactions(@PathVariable
    // String remitterId,
    // @RequestParam(required = false) String page) {
    // return ResponseEntity.ok(remitterAPIService.remitterTransactions(remitterId,
    // page));
    // }

    // @GetMapping("/{remitterId}/dashboard")
    // public ResponseEntity<Map<String, Object>> remitterDashboard(@PathVariable
    // String remitterId,
    // @RequestParam(required = false) String range) {
    // return ResponseEntity.ok(remitterAPIService.remitterDashboard(remitterId,
    // range));
    // }

    // @GetMapping("/{remitterId}/recipients")
    // public ResponseEntity<Map<String, Object>> remitterRecipients(@PathVariable
    // String remitterId,
    // @RequestParam(required = false, defaultValue = "1") String page) {
    // return ResponseEntity.ok(remitterAPIService.remitterRecipients(remitterId,
    // page));
    // }

    // @GetMapping("/{remitterId}/requests")
    // public ResponseEntity<Map<String, Object>> paymentRequests(@PathVariable
    // String remitterId,
    // @RequestParam(required = false) String page) {
    // return ResponseEntity.ok(remitterAPIService.paymentRequests(remitterId,
    // page));
    // }

    // @PostMapping("/{remitterId}/requests/{requestId}/settlements")
    // public ResponseEntity<Map<String, Object>> settlements(@PathVariable String
    // remitterId,
    // @PathVariable String requestId, @RequestBody Map<String, Object> payload) {
    // return ResponseEntity.ok(remitterAPIService.settlements(remitterId,
    // requestId, payload));
    // }

    // @PostMapping("/{remitterId}/requests/{requestId}/proof")
    // public ResponseEntity<Map<String, Object>> proof(@PathVariable String
    // remitterId, @PathVariable String requestId,
    // @RequestParam(required = false) String fileName) {
    // return ResponseEntity.ok(remitterAPIService.proof(remitterId, requestId,
    // fileName));
    // }

    @GetMapping("/{remitterId}/notifications")
    public ResponseEntity<Map<String, Object>> getNotifications(
            @PathVariable String remitterId,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int size) {
        return ResponseEntity.ok(remitterAPIService.getRemitterNotifications(remitterId, page, size));
    }

    @PostMapping("/{remitterId}/notifications/read")
    public ResponseEntity<Map<String, Object>> markNotificationsAsRead(
            @PathVariable String remitterId,
            @RequestBody(required = false) List<String> notificationIds) {
        return ResponseEntity.ok(remitterAPIService.markRemitterNotificationsAsRead(remitterId, notificationIds));
    }

    @GetMapping(value = "/{remitterId}/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamRemitterNotifications(@PathVariable String remitterId) {
        return notificationBroadcaster.subscribe(ReceiverType.Remitter, remitterId);
    }

}
