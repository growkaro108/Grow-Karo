package com.growkaro.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.growkaro.backend.security.JwtAuthenticationEntryPoint;
import com.growkaro.backend.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        // 1. Allow preflight OPTIONS requests for CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Public health, assets, and informational endpoints
                        .requestMatchers(
                                "/api/health", "/health",
                                "/api/home1-graph", "/home1-graph",
                                "/api/top5-schemes", "/top5-schemes",
                                "/api/scheme/**", "/scheme/**",
                                "/api/schemes/**", "/schemes/**",
                                "/api/config", "/config",
                                "/api/support", "/support",
                                "/api/contact", "/contact",
                                "/api/search/**", "/search/**",
                                "/api/user/test", "/user/test",
                                "/api/remitter/test", "/remitter/test",
                                "/uploads/**", "/api/uploads/**",
                                "/error", "/favicon.ico"
                        ).permitAll()

                        // 3. Public User Authentication & OTP endpoints
                        .requestMatchers(
                                "/api/user/signup/**", "/user/signup/**",
                                "/api/user/login/**", "/user/login/**",
                                "/api/user/getEmailOtp/**", "/user/getEmailOtp/**",
                                "/api/user/validateEmailOtp/**", "/user/validateEmailOtp/**",
                                "/api/user/forgot-password/**", "/user/forgot-password/**",
                                "/api/user/reset_password/**", "/user/reset_password/**",
                                "/api/user/reset-password/**", "/user/reset-password/**"
                        ).permitAll()

                        // 4. Public Remitter Authentication endpoints
                        .requestMatchers(
                                "/api/remitter/login/**", "/remitter/login/**",
                                "/api/remitters/login/**", "/remitters/login/**",
                                "/api/remitter/forgot-password/**", "/remitter/forgot-password/**",
                                "/api/remitters/forgot-password/**", "/remitters/forgot-password/**",
                                "/api/remitter/reset-password/**", "/remitter/reset-password/**",
                                "/api/remitters/reset-password/**", "/remitters/reset-password/**"
                        ).permitAll()

                        // 5. Admin role-restricted endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 6. User endpoints
                        .requestMatchers("/api/user/**").hasAnyRole("GRAHAK", "ADMIN")

                        // 7. Remitter endpoints
                        .requestMatchers("/api/remitter/**", "/api/remitters/**").hasAnyRole("REMITTER", "ADMIN")

                        // 8. All other requests require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
