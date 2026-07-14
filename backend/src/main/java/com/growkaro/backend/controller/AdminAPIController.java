package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.growkaro.backend.DRO.ReceiveSchemeData;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.service.AdminAPIService;

@RestController
@RequestMapping("/api/admin")
public class AdminAPIController {

    private final AdminAPIService adminAPIService;
    private final General general;

    public AdminAPIController(AdminAPIService adminAPIService, General general) {
        this.adminAPIService = adminAPIService;
        this.general = general;

    }

    @PostMapping("/scheme/create")
    public ResponseEntity<Map<String, Object>> createScheme(@RequestBody ReceiveSchemeData schemeData) {
        try {
            Thread.sleep(3000);
            // System.out.println(schemeData);
            if (schemeData == null) {
                return ResponseEntity.badRequest().build();
            }
            Scheme savedScheme = adminAPIService.createScheme(schemeData);
            return ResponseEntity
                    .ok(general.response("success", savedScheme.getSchemeName() + " saved successfully..", schemeData));
        } catch (InterruptedException e) {
            e.printStackTrace();
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
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/scheme/delete/{id}")
    public ResponseEntity<Boolean> deleteScheme(@PathVariable String id) {
        boolean status = adminAPIService.removeScheme(id);
        return status ? ResponseEntity.ok(true) : ResponseEntity.internalServerError().build();
    }

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

    @GetMapping("/status")
    public ResponseEntity<String> status() {
        return ResponseEntity.ok("its working");
    }

}
