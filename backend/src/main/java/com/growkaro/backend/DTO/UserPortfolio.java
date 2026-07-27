package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
        BigDecimal profit) {
}