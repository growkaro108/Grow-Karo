package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;

public record UserPortfolio(
                String schemeId,
                String schemeName,
                BigDecimal investmentAmount,
                Integer tenure,
                String payoutFrequency,
                Double profitPercentage,
                BigDecimal maturityValue,
                LocalDateTime enrollmentDate,
                List<String> bondImageURL,
                String bondNumber,
                LocalDate requestDate,
                String userSchemeId,
                Long paidAmount,
                Boolean isApproved,
                UserSchemeStatus status) {
}