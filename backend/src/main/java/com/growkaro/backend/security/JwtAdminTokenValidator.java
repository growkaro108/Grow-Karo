package com.growkaro.backend.security;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class JwtAdminTokenValidator implements AdminTokenValidator {

    private final JwtService jwtService;

    @Override
    public boolean isValidAdminToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        try {
            if (!jwtService.isTokenValid(token)) {
                return false;
            }

            String role = jwtService.extractRole(token);
            return "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
        } catch (Exception e) {
            log.warn("Failed to validate admin token: {}", e.getMessage());
            return false;
        }
    }
}
