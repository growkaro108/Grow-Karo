package com.growkaro.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.growkaro.backend.service.RemitterAPIService;

@RestController
@RequestMapping({ "/api/remitter", "/api/remitters" })
public class RemitterAPIController {

    private final RemitterAPIService remitterAPIService;

    public RemitterAPIController(RemitterAPIService remitterAPIService) {
        this.remitterAPIService = remitterAPIService;
    }

    @GetMapping("/{remitterId}/dashboard")
    public ResponseEntity<Map<String, Object>> remitterDashboard(@PathVariable String remitterId,
            @RequestParam(required = false) String range) {
        return ResponseEntity.ok(remitterAPIService.remitterDashboard(remitterId, range));
    }

    @GetMapping("/{remitterId}/transactions")
    public ResponseEntity<Map<String, Object>> remitterTransactions(@PathVariable String remitterId,
            @RequestParam(required = false) String page) {
        return ResponseEntity.ok(remitterAPIService.remitterTransactions(remitterId, page));
    }

    @GetMapping("/{remitterId}/recipients")
    public ResponseEntity<Map<String, Object>> remitterRecipients(@PathVariable String remitterId,
            @RequestParam(required = false, defaultValue = "1") String page) {
        return ResponseEntity.ok(remitterAPIService.remitterRecipients(remitterId, page));
    }

    @GetMapping("/{remitterId}/requests")
    public ResponseEntity<Map<String, Object>> paymentRequests(@PathVariable String remitterId,
            @RequestParam(required = false) String page) {
        return ResponseEntity.ok(remitterAPIService.paymentRequests(remitterId, page));
    }

    @PostMapping("/{remitterId}/requests/{requestId}/settlements")
    public ResponseEntity<Map<String, Object>> settlements(@PathVariable String remitterId,
            @PathVariable String requestId, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(remitterAPIService.settlements(remitterId, requestId, payload));
    }

    @PostMapping("/{remitterId}/requests/{requestId}/proof")
    public ResponseEntity<Map<String, Object>> proof(@PathVariable String remitterId, @PathVariable String requestId,
            @RequestParam(required = false) String fileName) {
        return ResponseEntity.ok(remitterAPIService.proof(remitterId, requestId, fileName));
    }

    @PutMapping("/{remitterId}/recipients/{recipientId}")
    public ResponseEntity<Map<String, Object>> updateRecipient(@PathVariable String remitterId,
            @PathVariable String recipientId, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(remitterAPIService.updateRecipient(remitterId, recipientId, payload));
    }

    @PostMapping("/{remitterId}/recipients")
    public ResponseEntity<Map<String, Object>> createRecipient(@PathVariable String remitterId,
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(remitterAPIService.createRecipient(remitterId, payload));
    }

}
