package com.growkaro.backend.security;

import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminPolicy {
    private final Set<String> adminEmails;

    public AdminPolicy(@Value("${ADMIN_EMAIL:wv9304@gmail.com}") String adminEmailsCsv) {
        if (adminEmailsCsv == null || adminEmailsCsv.isBlank()) {
            this.adminEmails = Collections.emptySet();
            return;
        }
        this.adminEmails = Arrays.stream(adminEmailsCsv.split(","))
                .map(String::trim)
            .map(String::toLowerCase)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isAdminEmail(String email) {
        if (email == null)
            return false;
        return adminEmails.contains(email.trim().toLowerCase());
    }
}
