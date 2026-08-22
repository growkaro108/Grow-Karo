package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserSchemeResponse(
        String userSchemeId,
        String schemeName,
        Double profitPercentage,
        BigDecimal paidAmount,
        LocalDateTime enrollmentDate,
        LocalDate maturityDate,
        String payoutCycle) {

}
