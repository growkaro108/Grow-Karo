package com.growkaro.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable()) // Disable CSRF for simplicity in APIs
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/api/user/health",
                                                                "/api/user/signup",
                                                                "/api/user/getEmailOtp/{email}",
                                                                "/api/user/validateEmailOtp",
                                                                "/api/user/test",
                                                                "/api/user/login",
                                                                "/api/user/dashboard",
                                                                "/api/user/scheme/enroll/{schemeId}/{userId}",
                                                                "/api/user/myscheme/{userId}",
                                                                "/api/user/scheme/user/{userId}",
                                                                "/api/user/scheme/withdraw/{userSchemeId}/{userId}",
                                                                "/api/scheme/get",
                                                                "/api/admin/scheme/create",
                                                                "/api/admin/scheme/update/{schemeId}",
                                                                "/api/admin/scheme/delete/{id}",
                                                                "/api/admin/user-scheme/all-users",
                                                                "/api/admin/user-scheme/approve",
                                                                "/api/admin/user-scheme/reject/{userSchemeId}/{userId}")
                                                .permitAll() // Public endpoints
                                                .anyRequest().authenticated() // Everything else requires login
                                )
                                .httpBasic(Customizer.withDefaults()); // Uses the correct Spring Security Customizer
                return http.build();
        }

}
