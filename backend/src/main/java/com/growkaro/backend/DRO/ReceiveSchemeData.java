package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReceiveSchemeData(
        String schemeId,
        String schemeName,
        String schemeCategory,
        String schemeDetails,
        String payoutFrequency,
        Integer tenure,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal minimumAmount,
        BigDecimal maximumAmount,
        Byte riskLevel,
        Boolean status,
        Double profitPercentage,
        Integer maxInvestorsAllowed,
        List<String> terms) {

    // Old clients that don't send "terms" get an empty list, not null.
    // Also trims each term and drops blanks.
    public ReceiveSchemeData {
        terms = terms == null
                ? List.of()
                : terms.stream()
                        .filter(t -> t != null && !t.isBlank())
                        .map(String::trim)
                        .toList();
    }
}