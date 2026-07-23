package com.growkaro.backend.controller;

import com.growkaro.backend.DTO.SchemeResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.service.AdminAPIService;
import com.growkaro.backend.service.ApiService;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final ApiService apiService;
    private final AdminAPIService adminAPIService;
    private final General general;

    public ApiController(ApiService apiService, @Lazy AdminAPIService adminAPIService, General general) {
        this.apiService = apiService;
        this.adminAPIService = adminAPIService;
        this.general = general;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(apiService.health());
    }

    @GetMapping("/scheme/get")
    public ResponseEntity<Map<String, Object>> getAllScheme() {
        try {
            List<SchemeResponse> allScheme = adminAPIService.getAllSchemes();
            if (allScheme == null)
                return ResponseEntity.internalServerError().build();
            else
                return ResponseEntity.ok(general.response("success", "Load successfully..", allScheme));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }

    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config() {
        return ResponseEntity.ok(apiService.config());
    }

    @GetMapping("/support")
    public ResponseEntity<Map<String, Object>> support() {
        return ResponseEntity.ok(apiService.support());
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam String query) {
        return ResponseEntity.ok(apiService.search(query));
    }

    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> contact(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(apiService.contact(payload));
    }

}
