package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ManualUserScheme(
        String userId,
        String schemeId,
        String nomineeId,
        BigDecimal paidAmount,
        LocalDate paidDate,
        List<UserSchemeProfitLedgerRequest> profitLedger,
        List<UserSchemeReedemLedgerRequest> reedemLedger) {
}