package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserSchemeReedemLedgerResponse(
        Long id,
        BigDecimal redeemAmount,
        LocalDate redeemDate) {
}