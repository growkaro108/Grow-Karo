package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserSchemeProfitLedgerResponse(
        Long id,
        BigDecimal profitAmount,
        LocalDate profitDate) {
}