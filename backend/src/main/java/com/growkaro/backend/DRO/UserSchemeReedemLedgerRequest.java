package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserSchemeReedemLedgerRequest(
        Long id,
        BigDecimal redeemAmount,
        LocalDate redeemDate) {
}