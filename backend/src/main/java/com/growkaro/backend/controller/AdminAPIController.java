package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.growkaro.backend.DRO.ApproveUserScheme;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.service.AdminAPIService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
public class AdminAPIController {

    private final AdminAPIService adminAPIService;
    private final General general;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/jpg");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    public AdminAPIController(AdminAPIService adminAPIService, General general) {
        this.adminAPIService = adminAPIService;
        this.general = general;

    }

    @PostMapping("/scheme/create")
    public ResponseEntity<Map<String, Object>> createScheme(@RequestBody ReceiveSchemeData schemeData) {
        try {
            if (schemeData == null) {
                return ResponseEntity.badRequest().build();
            }
            Scheme savedScheme = adminAPIService.createScheme(schemeData);
            return ResponseEntity
                    .ok(general.response("success", savedScheme.getSchemeName() + " saved successfully..", schemeData));
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
            Scheme updatedScheme = adminAPIService.updateScheme(schemeId, updateScheme);
            return ResponseEntity
                    .ok(general.response("success", updatedScheme.getSchemeName() + " is updated..", updateScheme));
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
        if ("".equals(approveUserScheme.userSchemeId()) || approveUserScheme.userSchemeId() == null
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

    // @PostMapping(value = "/scheme/bond/{userSchemeId}", consumes =
    // MediaType.MULTIPART_FORM_DATA_VALUE)
    // public ResponseEntity<Map<String, Object>> addBondDetails(
    // @PathVariable String userSchemeId,
    // String bondNumber,
    // MultipartFile image) {
    // return null;
    // if (userSchemeId == null || userSchemeId.isBlank()) {
    // return ResponseEntity.badRequest().body(general.response("error", "Invalid
    // userSchemeId", null));
    // }

    // boolean hasBondNumber = bondNumber != null && !bondNumber.isBlank();
    // boolean hasImage = image != null && !image.isEmpty();

    // if (!hasBondNumber && !hasImage) {
    // return ResponseEntity.badRequest()
    // .body(general.response("error", "Provide a bond number or an image", null));
    // }

    // if (hasImage) {
    // String contentType = image.getContentType();
    // if (contentType == null ||
    // !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
    // return ResponseEntity.badRequest()
    // .body(general.response("error", "Invalid file type: " +
    // image.getOriginalFilename(), null));
    // }
    // if (image.getSize() > MAX_FILE_SIZE_BYTES) {
    // return ResponseEntity.badRequest()
    // .body(general.response("error", image.getOriginalFilename() + " exceeds the
    // 5MB limit", null));
    // }
    // }

    // return ResponseEntity.ok(adminAPIService.addBondDetails(userSchemeId,
    // bondNumber, image));
    // }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> adminDashboard(@RequestParam(required = false) String range) {
        return ResponseEntity.ok(adminAPIService.adminDashboard(range));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<Map<String, Object>> withdrawals(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminAPIService.withdrawals(status));
    }

    @PutMapping("/withdrawals/{withdrawalId}")
    public ResponseEntity<Map<String, Object>> updateWithdrawal(@PathVariable String withdrawalId,
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminAPIService.updateWithdrawal(withdrawalId, payload));
    }

    @GetMapping("/issues")
    public ResponseEntity<Map<String, Object>> issues(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminAPIService.issues(status));
    }

    @PutMapping("/issues/{issueId}/resolve")
    public ResponseEntity<Map<String, Object>> resolveIssue(@PathVariable String issueId) {
        return ResponseEntity.ok(adminAPIService.resolveIssue(issueId));
    }

    @GetMapping("/remitters")
    public ResponseEntity<Map<String, Object>> remitters(@RequestParam(required = false) String page) {
        return ResponseEntity.ok(adminAPIService.remitters(page));
    }

    @PostMapping("/remitters")
    public ResponseEntity<Map<String, Object>> createRemitter(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminAPIService.createRemitter(payload));
    }

    @GetMapping("/fundraiser-codes")
    public ResponseEntity<Map<String, Object>> fundraiserCodes(@RequestParam(required = false) String page) {
        return ResponseEntity.ok(adminAPIService.fundraiserCodes(page));
    }

    @PostMapping("/fundraiser-codes")
    public ResponseEntity<Map<String, Object>> createFundraiserCode(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminAPIService.createFundraiserCode(payload));
    }

}
