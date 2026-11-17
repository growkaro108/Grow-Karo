package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PensionProfitDueResponse(
        Long id,
        String userSchemeId,
        String userName,
        String userEmail,
        String schemeName,
        String bondNumber,
        LocalDate profitDate,
        BigDecimal profitAmount) {
}
