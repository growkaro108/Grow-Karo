package com.growkaro.backend.controller;

import com.growkaro.backend.service.ApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final ApiService apiService;

    public ApiController(ApiService apiService) {
        this.apiService = apiService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(apiService.health());
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
