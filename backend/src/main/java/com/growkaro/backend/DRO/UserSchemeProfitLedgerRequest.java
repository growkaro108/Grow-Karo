package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserSchemeProfitLedgerRequest(
        Long id,
        BigDecimal profitAmount,
        LocalDate profitDate) {
}