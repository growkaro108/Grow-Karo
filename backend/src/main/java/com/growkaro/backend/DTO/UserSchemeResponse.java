package com.growkaro.backend.DTO;

import java.math.BigDecimal;

public record UserSchemeResponse(
                String userSchemeId,
                String schemeName,
                Double profitPercentage,
                String status,
                BigDecimal paidAmount,
                String enrollmentDate,
                String maturityDate,
                String bondUrl,
                String payoutCycle) {

}
