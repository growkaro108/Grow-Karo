package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

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

        BigDecimal totalProfit = us.getProfitLedger().stream()
                .map(z -> z.getProfitAmount())
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        BigDecimal totalRedeem = us.getReedemLedger().stream()
                .map(z -> z.getRedeemAmount())
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        BigDecimal netAmount = us.getPaidAmount().add(totalProfit.subtract(totalRedeem));

        LocalDate maturityDate = us.getMaturityDate();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        int remainingDays = (int) ChronoUnit.DAYS.between(today, maturityDate);

        return new NearMaturityUserSchemeResponse(
                us.getUserSchemeId(),
                u.getId(),
                u.getName(),
                u.getEmail(),
                s.getSchemeId(),
                s.getSchemeName(),
                us.getBondNumber(),
                us.getPaidAmount(),
                netAmount,
                maturityDate.format(DATE_FORMATTER),
                remainingDays,
                us.getBondImageURL());
    }
}