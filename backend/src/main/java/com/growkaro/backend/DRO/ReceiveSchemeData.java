package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReceiveSchemeData(
                String schemeName,
                String schemeCategory,
                String schemeDetails,
                String payoutFrequency,
                Integer tenure,
                LocalDate startDate,
                LocalDate endDate,
                BigDecimal investmentAmount,
                BigDecimal maturityValue,
                Boolean status,
                Double profitPercentage,
                Integer maxInvestorsAllowed) {
}
