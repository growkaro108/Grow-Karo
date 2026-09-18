package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;

public record AdminUser(
                String userId,
                String name,
                String email,
                String phone,
                boolean isActive,
                String joined,
                Long totalRedeem,
                List<UserSchemeResponse> enrolledSchemes) {
        public static AdminUser toAdminUser(User user) {
                BigDecimal totalRedeemed = BigDecimal.ZERO;
                for (UserScheme us : user.getEnrolledSchemes()) {
                        totalRedeemed = totalRedeemed.add(us.getProfitReedemed());
                }
                return new AdminUser(
                                user.getId(),
                                user.getName(),
                                user.getEmail(),
                                user.getPhone(),
                                user.isActive(),
                                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                                totalRedeemed.longValue(),
                                user.getEnrolledSchemes().stream().map(UserSchemeResponse::toUserSchemeResponse)
                                                .toList());
        }

}
