package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.growkaro.backend.enums.UserSchemeStatus;

public record UserPortfolio(
        String schemeId,
        String schemeName,
        Integer tenure,
        String payoutFrequency,
        Double profitPercentage,
        LocalDateTime enrollmentDate,
        String bondImageURL,
        String bondNumber,
        LocalDateTime requestDate,
        String userSchemeId,
        BigDecimal paidAmount,
        Boolean isApproved,
        BigDecimal profit,
        LocalDate nextPayoutDate,
        LocalDate paidDate,
        UserSchemeStatus status,
        LocalDate maturityDate) {
}