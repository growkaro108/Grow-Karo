package com.growkaro.backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.growkaro.backend.DRO.AddRemitter;
import com.growkaro.backend.DRO.ApproveUserScheme;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.DRO.RemitterCredentials;
import com.growkaro.backend.DTO.AddedRemitter;
import com.growkaro.backend.DTO.AdminTransactionResponse;
import com.growkaro.backend.DTO.AdminUser;
import com.growkaro.backend.DTO.PagedResponse;
import com.growkaro.backend.DTO.RemitterResponse;
import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.DTO.SearchUser;
import com.growkaro.backend.common.General;
import com.growkaro.backend.common.NotificationBroadcaster;
import com.growkaro.backend.entity.Notification.ReceiverType;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.entity.SupportIssue.Status;
import com.growkaro.backend.service.AdminAPIService;
import com.growkaro.backend.service.EmailService;
import com.growkaro.backend.service.CrucialNotificationService;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
public class AdminAPIController {

    private final AdminAPIService adminAPIService;
    private final EmailService emailService;
    private final General general;
    private final NotificationBroadcaster notificationBroadcaster;
    private final CrucialNotificationService crucialNotificationService;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/jpg");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    public AdminAPIController(AdminAPIService adminAPIService, EmailService emailService, General general,
            NotificationBroadcaster notificationBroadcaster, CrucialNotificationService crucialNotificationService) {
        this.adminAPIService = adminAPIService;
        this.emailService = emailService;
        this.general = general;
        this.notificationBroadcaster = notificationBroadcaster;
        this.crucialNotificationService = crucialNotificationService;
    }

    @PostMapping("/scheme/create")
    public ResponseEntity<Map<String, Object>> createScheme(@RequestBody ReceiveSchemeData schemeData) {
        try {
            if (schemeData == null) {
                return ResponseEntity.badRequest().build();
            }
            boolean status = adminAPIService.createScheme(schemeData);
            if (status) {
                List<SchemeResponse> schemes = adminAPIService.getAllSchemes(true);
                return ResponseEntity
                        .ok(general.response("success", schemeData.schemeName() + " saved successfully..", schemes));
            } else {
                return ResponseEntity
                        .ok(general.response("error", schemeData.schemeName() + " failed to save..", schemeData));
            }
        } catch (Exception e) {
            log.error("Error while creating scheme: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/scheme/update/{schemeId}")
    public ResponseEntity<Map<String, Object>> updateScheme(@PathVariable String schemeId,
            @RequestBody ReceiveSchemeData updateScheme) {
        if (schemeId == "" || schemeId == null || updateScheme == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            List<SchemeResponse> updatedSchemes = adminAPIService.updateScheme(schemeId, updateScheme);
            String schemeName = updatedSchemes.stream().map(SchemeResponse::schemeName).findFirst().orElse("");
            return ResponseEntity
                    .ok(general.response("success", schemeName + " is updated..", updatedSchemes));
        } catch (Exception e) {
            log.error("Error while updating scheme: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/scheme/delete/{id}")
    public ResponseEntity<Boolean> deleteScheme(@PathVariable String id) {
        boolean status = adminAPIService.removeScheme(id);
        return status ? ResponseEntity.ok(true) : ResponseEntity.internalServerError().build();
    }

    @GetMapping("/user-scheme/all-users")
    public ResponseEntity<Map<String, Object>> getAllUsersRequests() {
        return ResponseEntity.ok(adminAPIService.getAllUsersRequests());
    }

    @PutMapping("/user-scheme/approve")
    public ResponseEntity<Map<String, Object>> activateUserScheme(@RequestBody ApproveUserScheme approveUserScheme) {
        if ("".equals(approveUserScheme.userSchemeId()) ||
                approveUserScheme.userSchemeId() == null
                || approveUserScheme.paidAmount() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(adminAPIService.activateUsersScheme(approveUserScheme.userSchemeId(),
                approveUserScheme.paidAmount(), approveUserScheme.paidDate()));
    }

    @PutMapping("/user-scheme/reject/{userSchemeId}")
    public ResponseEntity<Map<String, Object>> rejectUserScheme(@PathVariable String userSchemeId) {
        return ResponseEntity.ok(adminAPIService.rejectUserScheme(userSchemeId));
    }

    @PostMapping(value = "/user_scheme/add-bond/{userSchemeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> addBondDetails(@PathVariable String userSchemeId,
            @RequestParam String bondNumber,
            @RequestParam(name = "image") MultipartFile image) {
        boolean hasBondNumber = bondNumber != null && !bondNumber.isBlank();
        boolean hasImage = image != null && !image.isEmpty();
        if (userSchemeId == null || userSchemeId.isBlank() || !hasBondNumber || !hasImage) {
            return ResponseEntity.badRequest().body(general.response("error", "Invalid request.", null));
        }

        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            return ResponseEntity.badRequest()
                    .body(general.response("error", "Invalid file type: " + image.getOriginalFilename(), null));
        }
        if (image.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest()
                    .body(general.response("error", image.getOriginalFilename() + " exceeds the 5MB limit", null));
        }

        return ResponseEntity.ok(adminAPIService.addBondDetails(userSchemeId,
                bondNumber, image));
    }

    @GetMapping("/activity-types")
    public List<String> getTypes() {
        return adminAPIService.getAllStoredActivityTypes();
    }

    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(defaultValue = "pending") String filter,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit) {
        // System.out.println(filter + " " + offset + " " + limit);
        if (filter.isBlank() || offset < 0 || limit > 50
                || limit < 1) {
            log.error("Invalid request: " + filter + " " + offset + " " + limit);
            return ResponseEntity.ok(general.response("error", "Invalid request.", null));
        }
        PagedResponse<AdminTransactionResponse> transactions = adminAPIService.getTransactions(
                filter,
                offset, limit);
        if (transactions == null) {
            return ResponseEntity.ok(general.response("error", "No transactions found", null));
        }
        return ResponseEntity.ok(general.response("success", "Transactions fetched successfully", transactions));
    }

    @PatchMapping("/transactions/{id}/approve/{remId}")
    public ResponseEntity<Map<String, Object>> approve(
            @PathVariable String id, @PathVariable String remId) {
        AdminTransactionResponse transaction = adminAPIService.approve(id, remId);
        if (transaction == null) {
            log.error("Transaction(Approve) not found: " + id);
            return ResponseEntity.ok(general.response("error", "Transaction not found", null));
        }
        return ResponseEntity.ok(general.response("success", "Transaction approved successfully", transaction));
    }

    @PatchMapping("/transactions/{id}/reject")
    public ResponseEntity<Map<String, Object>> reject(@PathVariable String id, @RequestBody String body) {

        String reason = (body != null && !body.isBlank()) ? body : null;
        AdminTransactionResponse transaction = adminAPIService.reject(id, reason);
        if (transaction == null) {
            log.error("Transaction(Reject) not found: " + id);
            return ResponseEntity.ok(general.response("error", "Transaction not found", null));
        }
        return ResponseEntity.ok(general.response("success", "Transaction rejected successfully", transaction));
    }

    @GetMapping("/user/search/{query}")
    public ResponseEntity<Map<String, Object>> searchUser(@PathVariable String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.ok(general.response("error", "Invalid request.", null));
        }
        List<SearchUser> users = adminAPIService.searchUser(query);
        if (users == null) {
            return ResponseEntity.ok(general.response("error", "No users found", null));
        }
        return ResponseEntity.ok(general.response("success", "Users fetched successfully", users));
    }

    @PostMapping("/remitter/add")
    public ResponseEntity<Map<String, Object>> addRemitter(@RequestBody AddRemitter addRemitter) {
        System.out.println(addRemitter);

        if (addRemitter == null
                || addRemitter.getOrganizationName().isBlank()
                || addRemitter.getAadharNumber().isBlank() || addRemitter.getPanNumber().isBlank()
                || addRemitter.getAllocationLimit().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.ok(general.response("info", "Invalid request.", null));
        }

        try {
            AddedRemitter ar = adminAPIService.createRemitter(addRemitter);
            return ResponseEntity.ok(general.response("success", "Remitter added successfully", ar));
        } catch (Exception e) {
            log.error("Error while adding remitter: " + e.getMessage(), e);
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }

    }

    @GetMapping("/remitters")
    private ResponseEntity<Map<String, Object>> remitterList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        if (limit <= 0 || limit > 10 || page < 0) {
            return ResponseEntity.ok(general.response("info", "Invalid request.", null));
        }
        try {
            Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
            PagedResponse<RemitterResponse> remitters = adminAPIService.getAllRemitters(pageable);
            if (remitters == null) {
                return ResponseEntity.ok(general.response("error", "No remitters found", null));
            }
            return ResponseEntity.ok(general.response("success", "Remitters fetched successfully", remitters));
        } catch (Exception e) {
            log.error("Error while fetching remitters: " + e.getMessage(), e);
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }
    }

    @PatchMapping("/remitter/update/{id}")
    public ResponseEntity<Map<String, Object>> updateRemitter(@PathVariable String id,
            @RequestBody AddRemitter updateRemitter) {
        if (id == null || id.isBlank() || updateRemitter == null) {
            return ResponseEntity.ok(general.response("error", "Invalid request.", null));
        }
        try {
            Boolean isupdatedRemitter = adminAPIService.updateRemitter(id, updateRemitter);
            return ResponseEntity.ok(general.response("success", "Remitter updated successfully", isupdatedRemitter));
        } catch (Exception e) {
            log.error("Error while updating remitter: " + e.getMessage());
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }
    }

    @DeleteMapping("/remitter/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteRemitter(@PathVariable String id) {
        if (id == null || id.isBlank()) {
            return ResponseEntity.ok(general.response("error", "Invalid request.", null));
        }
        try {
            Boolean isRemoved = adminAPIService.removeRemitter(id);
            return ResponseEntity.ok(general.response("success", "Remitter removed successfully", isRemoved));
        } catch (Exception e) {
            log.error("Error while removing remitter: " + e.getMessage());
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }
    }

    @PostMapping("/remitter/send-crendentials")
    public ResponseEntity<Map<String, Object>> sendCrendentials(@RequestBody RemitterCredentials CredentialPayload) {
        if (CredentialPayload == null) {
            return ResponseEntity.ok(general.response("error", "Invalid request.", null));
        }
        try {
            // System.out.println(CredentialPayload);
            // return ResponseEntity.ok(general.response("success", "Crendentials sent
            // successfully", true));

            emailService.sendCrendentialsToRemitter(CredentialPayload);
            return ResponseEntity.ok(general.response("success", "Crendentials sent successfully", true));
        } catch (Exception e) {
            log.error("Error while sending crendentials: " + e.getMessage());
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> getNotifications(
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(adminAPIService.getAdminNotifications(page, size));
    }

    @PostMapping("/notifications/read")
    public ResponseEntity<Map<String, Object>> markNotificationsAsRead(
            @RequestBody(required = false) List<String> notificationIds) {
        return ResponseEntity.ok(adminAPIService.markAdminNotificationsAsRead(notificationIds));
    }

    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAdminNotifications(
            @RequestParam(required = false, defaultValue = "GLOBAL") String adminId) {
        return notificationBroadcaster.subscribe(ReceiverType.Admin, adminId);
    }

    @GetMapping("/user/all")
    public ResponseEntity<Map<String, Object>> getAllUser(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        if (page < 0 || limit <= 0 || limit > 20 || page > 100) {
            page = 0;
            limit = 10;
        }
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        try {
            PagedResponse<AdminUser> users = adminAPIService.getAllUsers(pageable);
            if (users == null) {
                return ResponseEntity.ok(general.response("error", "No users found", null));
            }
            return ResponseEntity.ok(general.response("success", "Users fetched successfully", users));
        } catch (Exception e) {
            log.error("Error while fetching users: " + e.getMessage());
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }
    }

    @GetMapping("/{status}/issues")
    public Map<String, Object> issues(@PathVariable String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        if (page < 1 || limit <= 0 || limit > 20 || page > 100) {
            page = 1;
            limit = 10;
        }
        try {
            // The API accepts 1-based page numbers; Spring Data uses a 0-based index.
            Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
            if (status == null || status.isBlank()) {
                return general.response("error", "Invalid status.", null);
            }
            switch (status.toLowerCase()) {
                case "unresolved":
                    return general.response("success", "Issues fetched successfully",
                            adminAPIService.issues(Status.OPEN, pageable));
                case "in_progress":
                    return general.response("success", "Issues fetched successfully",
                            adminAPIService.issues(Status.IN_PROGRESS, pageable));
                case "resolved":
                    return general.response("success", "Issues fetched successfully",
                            adminAPIService.issues(Status.CLOSED, pageable));
                default:
                    return general.response("error", "Invalid status.", null);
            }
        } catch (Exception e) {
            log.error("Error while fetching issues: " + e.getMessage());
            return general.response("error",
                    "something went wrong..", null);
        }
    }

    @PutMapping("/issues/send-reply")
    public ResponseEntity<Map<String, Object>> sendReply(@RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.ok(adminAPIService.sendReply(
                    general.stringValue(payload.get("issueId")),
                    general.stringValue(payload.get("reply"))));
        } catch (Exception e) {
            log.error("Error while sending reply: " + e.getMessage());
            return ResponseEntity.ok(general.response("error",
                    e.getMessage(), null));
        }
    }

    @PutMapping("/issues/{id}/mark-resolved")
    public ResponseEntity<Map<String, Object>> markResolved(@PathVariable String id) {
        try {
            return ResponseEntity.ok(adminAPIService.markIssueResolved(id));
        } catch (Exception e) {
            log.error("Error while marking issue resolved: " + e.getMessage());
            return ResponseEntity.ok(general.response("error", "something went wrong..", null));
        }
    }

    // pendings

    @PutMapping("/issues/{issueId}/resolve")
    public ResponseEntity<Map<String, Object>> resolveIssue(@PathVariable String issueId) {
        return ResponseEntity.ok(adminAPIService.resolveIssue(issueId));
    }

    // @GetMapping("/remitters")
    // public ResponseEntity<Map<String, Object>> remitters(@RequestParam(required =
    // false) String page) {
    // return ResponseEntity.ok(adminAPIService.remitters(page));
    // }

    // @GetMapping("/fundraiser-codes")
    // public ResponseEntity<Map<String, Object>>
    // fundraiserCodes(@RequestParam(required = false) String page) {
    // return ResponseEntity.ok(adminAPIService.fundraiserCodes(page));
    // }

    // @PostMapping("/fundraiser-codes")
    // public ResponseEntity<Map<String, Object>> createFundraiserCode(@RequestBody
    // Map<String, Object> payload) {
    // return ResponseEntity.ok(adminAPIService.createFundraiserCode(payload));
    // }

    @PostMapping("/notifications/send-essential")
    public ResponseEntity<Map<String, Object>> sendEssentialNotification(
            @RequestBody Map<String, Object> payload) {
        try {
            String actionStr = general.stringValue(payload.get("action"));
            String userId = general.stringValue(payload.get("userId"));
            String remitterId = general.stringValue(payload.get("remitterId"));
            String actionUrl = general.stringValue(payload.get("actionUrl"));
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) payload.getOrDefault("params", Map.of());

            EssentialActionType action = EssentialActionType.valueOf(actionStr);
            User user = userId != null ? adminAPIService.getUserById(userId) : null;
            Remitter remitter = remitterId != null ? adminAPIService.getRemitterById(remitterId) : null;

            crucialNotificationService.notifyAllForEssentialAction(
                    action,
                    user,
                    List.of(), // default to broadcast via SSE to all admins
                    remitter,
                    actionUrl,
                    params);

            return ResponseEntity.ok(general.response("ok", "Essential notifications dispatched successfully", null));
        } catch (Exception e) {
            log.error("Failed to send essential notifications: {}", e.getMessage());
            return ResponseEntity.badRequest().body(general.response("error", e.getMessage(), null));
        }
    }

}
