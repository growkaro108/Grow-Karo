package com.growkaro.backend.security;

/**
 * Wire this to your existing JWT service. Example implementation:
 *
 * <pre>
 * {@literal @}Component
 * public class JwtAdminTokenValidator implements AdminTokenValidator {
 *     private final JwtService jwtService; // your existing service
 *
 *     public JwtAdminTokenValidator(JwtService jwtService) {
 *         this.jwtService = jwtService;
 *     }
 *
 *     {@literal @}Override
 *     public boolean isValidAdminToken(String token) {
 *         try {
 *             var claims = jwtService.parseAndValidate(token);
 *             return "ADMIN".equals(claims.get("role"));
 *         } catch (Exception e) {
 *             return false;
 *         }
 *     }
 * }
 * </pre>
 */
public interface AdminTokenValidator {
    boolean isValidAdminToken(String token);
}
