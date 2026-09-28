package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;

public record SchemeResponse(
                String schemeId,
                String schemeName,
                String schemeCategory,
                String schemeDetails,
                String payoutFrequency,
                Integer tenure,
                LocalDate startDate,
                LocalDate endDate,
                Boolean status,
                BigDecimal minimumAmount,
                BigDecimal maximumAmount,
                Double profitPercentage,
                Integer maxInvestorsAllowed,
                LocalDateTime updatedAt,
                Byte riskLevel,
                List<String> joinedUsers,
                List<String> terms) {

        public static SchemeResponse fromEntity(Scheme scheme) {
                return new SchemeResponse(
                                scheme.getSchemeId(),
                                scheme.getSchemeName(),
                                scheme.getSchemeCategory(),
                                scheme.getSchemeDetails(),
                                scheme.getPayoutFrequency(),
                                scheme.getTenure(),
                                scheme.getStartDate(),
                                scheme.getEndDate(),
                                scheme.getStatus(),
                                scheme.getMinimumAmount(),
                                scheme.getMaximumAmount(),
                                scheme.getProfitPercentage(),
                                scheme.getMaxInvestorsAllowed(),
                                scheme.getUpdatedAt(),
                                scheme.getRiskLevel(),
                                scheme.getJoinedUsers().stream().map(UserScheme::getUserSchemeId).toList(),
                                termsOf(scheme));
        }

        public static SchemeResponse fromEntity(Scheme scheme, boolean wantJoinedUser) {
                return new SchemeResponse(
                                scheme.getSchemeId(),
                                scheme.getSchemeName(),
                                scheme.getSchemeCategory(),
                                scheme.getSchemeDetails(),
                                scheme.getPayoutFrequency(),
                                scheme.getTenure(),
                                scheme.getStartDate(),
                                scheme.getEndDate(),
                                scheme.getStatus(),
                                scheme.getMinimumAmount(),
                                scheme.getMaximumAmount(),
                                scheme.getProfitPercentage(),
                                scheme.getMaxInvestorsAllowed(),
                                scheme.getUpdatedAt(),
                                scheme.getRiskLevel(),
                                wantJoinedUser
                                                ? scheme.getJoinedUsers().stream().map(UserScheme::getUserSchemeId)
                                                                .toList()
                                                : null,
                                termsOf(scheme));
        }

        // Never null, and an immutable copy so the Hibernate-managed list isn't
        // exposed.
        private static List<String> termsOf(Scheme scheme) {
                return scheme.getTerms() == null
                                ? List.of()
                                : scheme.getTerms().stream().filter(Objects::nonNull).toList();
        }
}