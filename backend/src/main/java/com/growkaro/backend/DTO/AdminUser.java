package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import com.growkaro.backend.common.General;
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

        private static final DateTimeFormatter JOINED_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        // If General has @Autowired dependencies, inject it instead of creating it
        // here.
        private static final General GENERAL = new General();

        public static AdminUser toAdminUser(User user) {
                List<UserScheme> schemes = user.getEnrolledSchemes() == null
                                ? List.of()
                                : user.getEnrolledSchemes();

                BigDecimal totalRedeemed = BigDecimal.ZERO;
                for (UserScheme us : schemes) {
                        Map<String, BigDecimal> map = GENERAL.countTotalProfitAndRedeemAndFinalAmount(us);
                        BigDecimal redeemed = map == null ? null : map.get("totalReedem");
                        if (redeemed != null) {
                                totalRedeemed = totalRedeemed.add(redeemed);
                        }
                }

                return new AdminUser(
                                user.getId(),
                                user.getName(),
                                user.getEmail(),
                                user.getPhone(),
                                user.isActive(),
                                user.getCreatedAt() == null ? "" : user.getCreatedAt().format(JOINED_FORMAT),
                                totalRedeemed.longValue(),
                                schemes.stream().map(UserSchemeResponse::toUserSchemeResponse).toList());
        }
}