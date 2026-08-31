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
                                                                "/api/health",
                                                                "/api/user/test",
                                                                "/api/remitter/test",
                                                                "/api/user/signup",
                                                                "/api/user/getEmailOtp/{email}",
                                                                "/api/user/validateEmailOtp",
                                                                "/api/user/login",
                                                                "/api/user/dashboard",
                                                                "/api/user/scheme/enroll",
                                                                "/api/user/myscheme/{userId}",
                                                                "/api/user/scheme/user/{userId}",
                                                                "/api/user/scheme/withdraw/{userSchemeId}/{userId}",
                                                                "/api/user/forgot-password/{email}",
                                                                "/api/user/reset_password",
                                                                "/api/user/{userId}",
                                                                "/api/user/change_password",
                                                                "/api/user/redeemProfit",
                                                                "/api/user/redeemAggressive",
                                                                "/api/user/{userId}/transactions",
                                                                "/api/user/{userId}/nominees",
                                                                "/api/user/{userId}/nominees/{nomineeId}",
                                                                "/api/user/addNominee",
                                                                "/api/user/logout/{userID}/{userName}",
                                                                "/api/user/{userId}/notifications",
                                                                "/api/user/{userId}/notifications/read",
                                                                "/api/user/{userId}/notifications/stream",
                                                                "/api/user/{userId}/raiseIssue",
                                                                "/api/user/{userId}/issues",
                                                                "/api/user/issue/comment",
                                                                "/uploads/bonds/**",
                                                                "/uploads/settlements/**",
                                                                "/api/scheme/get",
                                                                "/api/admin/scheme/create",
                                                                "/api/admin/scheme/update/{schemeId}",
                                                                "/api/admin/scheme/delete/{id}",
                                                                "/api/admin/user-scheme/all-users",
                                                                "/api/admin/user-scheme/approve",
                                                                "/api/admin/user-scheme/reject/{userSchemeId}",
                                                                "/api/admin/activity-logs/**",
                                                                "/api/admin/user_scheme/add-bond/{userSchemeId}",
                                                                "/api/uploads/**",
                                                                "/api/admin/activity-types",
                                                                "/api/admin/transactions",
                                                                "/api/admin/transactions/{id}/approve/{remid}",
                                                                "/api/admin/transactions/{id}/reject",
                                                                "/api/admin/user/search/{query}",
                                                                "/api/admin/remitter/add",
                                                                "/api/admin/remitters",
                                                                "/api/admin/remitter/update/{id}",
                                                                "/api/admin/remitter/delete/{id}",
                                                                "/api/admin/remitter/send-crendentials",
                                                                "/api/admin/notifications",
                                                                "/api/admin/notifications/read",
                                                                "/api/admin/notifications/stream",
                                                                "/api/admin/user/all",
                                                                "/api/admin/{status}/issues",
                                                                "/api/admin/issues/send-reply",
                                                                "/api/admin/issues/{id}/mark-resolved",
                                                                "/api/remitter/login",
                                                                "/api/remitter/forgot-password/{email}",
                                                                "/api/remitter/reset-password/{remitterId}",
                                                                "/api/remitter/{remitterId}/txncounts",
                                                                "/api/remitter/{remitterId}/transactions",
                                                                "/api/remitter/{remitterId}/pending-payments",
                                                                "/api/remitter/settlements",
                                                                "/api/remitter/transactions",
                                                                "/api/remitter/{remitterId}/recipients",
                                                                "/api/remitter/logout",
                                                                "/api/remitter/{remitterId}/notifications",
                                                                "/api/remitter/{remitterId}/notifications/read",
                                                                "/api/remitter/{remitterId}/notifications/stream",
                                                                "/api/remitter/{remitterId}/timeline")
                                                .permitAll() // Public endpoints
                                                .anyRequest().authenticated() // Everything else requires login
                                )
                                .httpBasic(Customizer.withDefaults()); // Uses the correct Spring Security
                // Customizer
                return http.build();
        }

}
