package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UserSchemeDetailsUpdateRequest(
        String schemeId,
        BigDecimal paidAmount,
        LocalDate paidDate,
        LocalDate maturityDate,
        String nomineeId) {
}
