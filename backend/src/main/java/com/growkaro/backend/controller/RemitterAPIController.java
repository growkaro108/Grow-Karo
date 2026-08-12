package com.growkaro.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.growkaro.backend.DTO.RemitterResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.service.RemitterAPIService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping({ "/api/remitter", "/api/remitters" })
public class RemitterAPIController {

    private final RemitterAPIService remitterAPIService;
    private final General general;

    public RemitterAPIController(RemitterAPIService remitterAPIService, General general) {
        this.remitterAPIService = remitterAPIService;
        this.general = general;
    }

    @PostMapping("/login")
    private Map<String, Object> login(@RequestBody Map<String, Object> credentials) {
        String email = general.stringValue(credentials.get("email"));
        String password = general.stringValue(credentials.get("password"));
        String role = general.stringValue(credentials.get("role"));
        try {
            if (password == null || password.isEmpty() || email == null || email.isEmpty() || role == null
                    || role.isEmpty() || !role.equals("remiter")) {
                return general.response("error", "Invalid request", null);
            }
            RemitterResponse rr = remitterAPIService.login(email, password);
            if (rr != null) {
                return general.response("ok", "Login successful", rr);
            } else {
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
    public Map<String, Object> resetPassword(@PathVariable String remitterId, @RequestBody String passWord) {
        System.out.println(remitterId + " " + passWord);
        return null;
        // try {
        // if (remitterId == null || remitterId.isEmpty() || payload == null) {
        // return general.response("error", "Invalid request", null);
        // }
        // String message = remitterAPIService.resetPassword(remitterId, payload);
        // if (message != null) {
        // return general.response("success", message, null);
        // } else {
        // return general.response("error", "Something went wrong..", null);
        // }
        // } catch (Exception e) {
        // log.error("Error in remitter reset password: remitterId {} because {} ",
        // remitterId, e.getMessage());
        // return general.response("error", "Something went wrong..", null);
        // }
    }

    // @GetMapping("/{remitterId}/dashboard")
    // public ResponseEntity<Map<String, Object>> remitterDashboard(@PathVariable
    // String remitterId,
    // @RequestParam(required = false) String range) {
    // return ResponseEntity.ok(remitterAPIService.remitterDashboard(remitterId,
    // range));
    // }

    // @GetMapping("/{remitterId}/transactions")
    // public ResponseEntity<Map<String, Object>> remitterTransactions(@PathVariable
    // String remitterId,
    // @RequestParam(required = false) String page) {
    // return ResponseEntity.ok(remitterAPIService.remitterTransactions(remitterId,
    // page));
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

}
