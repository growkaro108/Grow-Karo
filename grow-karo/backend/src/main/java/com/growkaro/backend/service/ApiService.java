package com.growkaro.backend.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.entity.FundraiserCode;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.SupportIssue;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.repository.FundraiserCodeRepository;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.SupportIssueRepository;
import com.growkaro.backend.repository.UserRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ApiService {

    private final UserRepository userRepository;
    private final RemitterRepository remitterRepository;
    private final FundraiserCodeRepository fundraiserCodeRepository;
    private final SupportIssueRepository supportIssueRepository;

    public ApiService(UserRepository userRepository,
            RemitterRepository remitterRepository,
            FundraiserCodeRepository fundraiserCodeRepository,
            SupportIssueRepository supportIssueRepository) {
        this.userRepository = userRepository;
        this.remitterRepository = remitterRepository;
        this.fundraiserCodeRepository = fundraiserCodeRepository;
        this.supportIssueRepository = supportIssueRepository;
    }

    @Cacheable(value = "health", key = "#root.methodName")
    @Transactional(readOnly = true)
    public Map<String, Object> health() {
        return response("ok", "Backend is healthy", Map.of(
                "services", Map.of("postgres", true, "redis", true),
                "counts", Map.of(
                        "users", userRepository.count(),
                        "remitters", remitterRepository.count(),
                        "fundraiserCodes", fundraiserCodeRepository.count())));
    }

    @Cacheable(value = "config", key = "#root.methodName")
    public Map<String, Object> config() {
        return response("ok", "Platform config loaded", Map.of("appName", "Grow Karo", "environment", "local"));
    }

    @Cacheable(value = "support", key = "#root.methodName")
    public Map<String, Object> support() {
        return response("ok", "Support center available",
                Map.of("email", "support@grow-karo.com", "phone", "+91-9000000000"));
    }

    @Cacheable(value = "search", key = "#query")
    @Transactional(readOnly = true)
    public Map<String, Object> search(String query) {
        String safeQuery = query == null ? "" : query.trim();
        if (safeQuery.isBlank()) {
            return response("ok", "Search results ready", Map.of("query", safeQuery, "results", List.of()));
        }

        List<Map<String, Object>> users = userRepository.searchUsers(safeQuery, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(this::userResult)
                .toList();
        List<Map<String, Object>> remitters = remitterRepository.searchRemitters(safeQuery, PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(this::remitterResult)
                .toList();
        List<Map<String, Object>> codes = fundraiserCodeRepository.findAllValidCodes(java.time.LocalDateTime.now())
                .stream()
                .filter(code -> code.getCode().toLowerCase().contains(safeQuery.toLowerCase()))
                .limit(5)
                .map(this::codeResult)
                .toList();

        return response("ok", "Search results ready", Map.of(
                "query", safeQuery,
                "results", java.util.stream.Stream.of(users, remitters, codes).flatMap(List::stream).toList()));
    }

    @Transactional
    public Map<String, Object> contact(Map<String, Object> payload) {
        Optional<User> userOpt = userRepository.findAll(PageRequest.of(0, 1)).stream().findFirst();
        if (userOpt.isEmpty()) {
            return response("error", "Create a user before submitting support requests", Map.of("received", payload));
        }

        SupportIssue issue = new SupportIssue();
        issue.setUser(userOpt.get());
        issue.setTitle(firstString(payload, "subject", "title", "name"));
        issue.setDescription(firstString(payload, "message", "description", "email"));
        if (issue.getTitle() == null) {
            issue.setTitle("Contact form request");
        }
        if (issue.getDescription() == null) {
            issue.setDescription(payload.toString());
        }

        return response("ok", "Contact request accepted",
                Map.of("issue", issueResult(supportIssueRepository.save(issue))));
    }

    public Map<String, Object> response(String status, String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("data", data != null ? data : Map.of());
        return response;
    }

    private Map<String, Object> userResult(User user) {
        return Map.of("id", user.getId(), "type", "user", "name", user.getName(), "email", user.getEmail());
    }

    private Map<String, Object> remitterResult(Remitter remitter) {
        return Map.of("id", remitter.getId(), "type", "remitter", "name", remitter.getOrganizationName());
    }

    private Map<String, Object> codeResult(FundraiserCode code) {
        return Map.of("id", code.getId(), "type", "fundraiserCode", "name", code.getCode());
    }

    private Map<String, Object> issueResult(SupportIssue issue) {
        return Map.of("id", issue.getId(), "title", issue.getTitle(), "status", issue.getStatus());
    }

    private String firstString(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && !value.toString().trim().isBlank()) {
                return value.toString().trim();
            }
        }
        return null;
    }

    public String makePasswordHash(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(7));
    }
}
