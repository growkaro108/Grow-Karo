package com.growkaro.backend.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        log.warn("Unauthorized request to {} from IP {}: {}", request.getRequestURI(), request.getRemoteAddr(),
                authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String jsonResponse = String.format(
                "{\"status\":\"error\",\"message\":\"Unauthorized access. Please login with a valid session.\",\"path\":\"%s\",\"timestamp\":\"%s\"}",
                request.getRequestURI(),
                LocalDateTime.now(ZoneId.of("Asia/Kolkata")).toString()
        );

        response.getWriter().write(jsonResponse);
    }
}
