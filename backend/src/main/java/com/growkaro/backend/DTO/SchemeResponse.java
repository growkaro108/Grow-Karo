package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SchemeResponse(
        String schemeId,
        String schemeName,
        String schemeCategory,
        String schemeDetails,
        String payoutFrequency,
        Integer tenure,
        LocalDate startDate,
        LocalDate endDate,
        Boolean status,
        BigDecimal minimumAmount,
        Double profitPercentage,
        Integer maxInvestorsAllowed,
        LocalDateTime updatedAt,
        Byte riskLevel,
        List<String> joinedUsers) {
}