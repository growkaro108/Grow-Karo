package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;

public record NearMaturityUserSchemeResponse(
                String id,
                String userId,
                String userName,
                String userEmail,
                String schemeId,
                String schemeName,
                String bondNumber,
                BigDecimal investmentAmount,
                BigDecimal maturityAmount,
                String maturityDate,
                int daysRemaining,
                String bondImage) {

        private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");

        public static NearMaturityUserSchemeResponse fromUserScheme(UserScheme us) {
                User u = us.getUser();
                Scheme s = us.getScheme();

                LocalDate maturityDate = us.getMaturityDate();
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
                int remainingDays = (int) ChronoUnit.DAYS.between(today, maturityDate);
                General g = new General();
                BigDecimal maturityAmount = g.calculateMaturityAmount(us);
                return new NearMaturityUserSchemeResponse(
                                us.getUserSchemeId(),
                                u.getId(),
                                u.getName(),
                                u.getEmail(),
                                s.getSchemeId(),
                                s.getSchemeName(),
                                us.getBondNumber(),
                                us.getPaidAmount(),
                                maturityAmount,
                                maturityDate.format(DATE_FORMATTER),
                                remainingDays,
                                us.getBondImageURL());
        }
}