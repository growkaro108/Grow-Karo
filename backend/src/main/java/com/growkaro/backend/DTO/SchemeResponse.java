package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

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
        BigDecimal investmentAmount,
        Double profitPercentage,
        BigDecimal maturityValue,
        Integer maxInvestorsAllowed
) {}