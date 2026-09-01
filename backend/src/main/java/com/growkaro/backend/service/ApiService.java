package com.growkaro.backend.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.SupportIssue;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.repository.RemitterRepository;
import com.growkaro.backend.repository.SchemeRepository;
import com.growkaro.backend.repository.SupportIssueRepository;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class ApiService {

    private final UserRepository userRepository;
    private final RemitterRepository remitterRepository;
    private final SupportIssueRepository supportIssueRepository;
    private final SchemeRepository schemeRepository;
    private final UserSchemeRepository userSchemeRepository;
    private final General general;

    public ApiService(UserRepository userRepository,
            RemitterRepository remitterRepository,
            SupportIssueRepository supportIssueRepository,
            UserSchemeRepository userSchemeRepository, SchemeRepository schemeRepository,
            General general) {
        this.userRepository = userRepository;
        this.remitterRepository = remitterRepository;
        this.supportIssueRepository = supportIssueRepository;
        this.userSchemeRepository = userSchemeRepository;
        this.schemeRepository = schemeRepository;
        this.general = general;
    }

    // caching user scheme
    public UserScheme getUserSchemeById(String userSchemeId) {
        return userSchemeRepository.findById(userSchemeId).get();
    }

    // check user scheme exists
    public boolean isUserSchemeExits(String userSchemeId) {
        return getUserSchemeById(userSchemeId) != null;
    }

    @Cacheable(value = "health", key = "#root.methodName")
    @Transactional(readOnly = true)
    public Map<String, Object> health() {
        return general.response("ok", "Backend is healthy", Map.of(
                "services", Map.of("postgres", true, "redis", true),
                "counts", Map.of(
                        "users", userRepository.count(),
                        "remitters", remitterRepository.count())));
    }

    public Map<String, Object> homeGraph() {
        try { // i want how much users invest in which mont like
              // jan:10000,feb:20000,mar:30000,apr:40000,may:50000,jun:60000,jul:70000,aug:80000,sep:90000,oct:100000,nov:110000,dec:120000
              // from userSchemes table
              // 1.get all user scheme and sort by createdAt
            List<UserScheme> userSchemes = userSchemeRepository.findAll(Sort.by(Sort.Direction.DESC, "requestDate"));

            Map<String, BigDecimal> graph = new LinkedHashMap<>();
            graph.put("jan", BigDecimal.ZERO);
            graph.put("feb", BigDecimal.ZERO);
            graph.put("mar", BigDecimal.ZERO);
            graph.put("apr", BigDecimal.ZERO);
            graph.put("may", BigDecimal.ZERO);
            graph.put("jun", BigDecimal.ZERO);
            graph.put("jul", BigDecimal.ZERO);
            graph.put("aug", BigDecimal.ZERO);
            graph.put("sep", BigDecimal.ZERO);
            graph.put("oct", BigDecimal.ZERO);
            graph.put("nov", BigDecimal.ZERO);
            graph.put("dec", BigDecimal.ZERO);
            for (UserScheme userScheme : userSchemes) {
                String month = userScheme.getRequestDate().getMonth().name().toLowerCase().substring(0, 3);
                graph.put(month, graph.get(month).add(userScheme.getPaidAmount()));
            }
            // remove all entries from this map where value is zero
            graph.entrySet().removeIf(entry -> entry.getValue().equals(BigDecimal.ZERO));

            return general.response("success", "Home graph loaded", graph);
        } catch (Exception e) {
            log.error("Error in homeGraph", e);
            return general.response("error", "Error in home graph", null);
        }
    }

    @Cacheable(value = "top5Schemes", key = "#root.methodName")
    @Transactional(readOnly = true)
    public Map<String, Object> top5Schemes() {
        try {
            // get top 5 schemes based on no of users joined
            List<Scheme> schemes = schemeRepository.findAll();
            schemes.sort((s1, s2) -> Integer.compare(s2.getJoinedUsers().size(), s1.getJoinedUsers().size()));
            int totalJoinedUser = 0;
            Map<String, Integer> top5Schemes = new LinkedHashMap<>();
            int limit = Math.min(5, schemes.size());
            for (int i = 0; i < limit; i++) {
                totalJoinedUser += schemes.get(i).getJoinedUsers().size();
                top5Schemes.put(schemes.get(i).getSchemeName(), schemes.get(i).getJoinedUsers().size());
            }
            return general.response("success", "Top 5 schemes loaded",
                    Map.of("totalJoinedUser", totalJoinedUser, "top5Schemes", top5Schemes));
        } catch (Exception e) {
            log.error("Error in top5Schemes", e);
            return general.response("error", "Error in top5Schemes", null);
        }
    }

    @Cacheable(value = "config", key = "#root.methodName")
    public Map<String, Object> config() {
        return general.response("ok", "Platform config loaded", Map.of("appName", "Grow Karo", "environment", "local"));
    }

    @Cacheable(value = "support", key = "#root.methodName")
    public Map<String, Object> support() {
        return general.response("ok", "Support center available",
                Map.of("email", "support@grow-karo.com", "phone", "+91-9000000000"));
    }

    // @Cacheable(value = "search", key = "#query")
    // @Transactional(readOnly = true)
    // public Map<String, Object> search(String query) {
    // String safeQuery = query == null ? "" : query.trim();
    // if (safeQuery.isBlank()) {
    // return response("ok", "Search results ready", Map.of("query", safeQuery,
    // "results", List.of()));
    // }

    // List<Map<String, Object>> users = userRepository.searchUsers(safeQuery,
    // PageRequest.of(0, 5))
    // .getContent()
    // .stream()
    // .map(this::userResult)
    // .toList();
    // List<Map<String, Object>> remitters =
    // remitterRepository.searchRemitters(safeQuery, PageRequest.of(0, 5))
    // .getContent()
    // .stream()
    // .map(this::remitterResult)
    // .toList();
    // List<Map<String, Object>> codes =
    // fundraiserCodeRepository.findAllValidCodes(java.time.LocalDateTime.now())
    // .stream()
    // .filter(code ->
    // code.getCode().toLowerCase().contains(safeQuery.toLowerCase()))
    // .limit(5)
    // .map(this::codeResult)
    // .toList();

    // return response("ok", "Search results ready", Map.of(
    // "query", safeQuery,
    // "results", java.util.stream.Stream.of(users, remitters,
    // codes).flatMap(List::stream).toList()));
    // }

    @Transactional
    public Map<String, Object> contact(Map<String, Object> payload) {
        Optional<User> userOpt = userRepository.findAll(PageRequest.of(0, 1)).stream().findFirst();
        if (userOpt.isEmpty()) {
            return general.response("error", "Create a user before submitting support requests",
                    Map.of("received", payload));
        }

        SupportIssue issue = new SupportIssue();
        issue.setSubmitterId(userOpt.get().getId());
        issue.setTitle(firstString(payload, "subject", "title", "name"));
        issue.setDescription(firstString(payload, "message", "description", "email"));
        if (issue.getTitle() == null) {
            issue.setTitle("Contact form request");
        }
        if (issue.getDescription() == null) {
            issue.setDescription(payload.toString());
        }

        return general.response("ok", "Contact request accepted",
                Map.of("issue", issueResult(supportIssueRepository.save(issue))));
    }

    private Map<String, Object> userResult(User user) {
        return Map.of("id", user.getId(), "type", "user", "name", user.getName(), "email", user.getEmail());
    }

    private Map<String, Object> remitterResult(Remitter remitter) {
        return Map.of("id", remitter.getRemitterId(), "type", "remitter", "name", remitter.getOrganizationName());
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
