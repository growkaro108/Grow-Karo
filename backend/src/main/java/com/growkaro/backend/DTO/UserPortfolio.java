package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.growkaro.backend.entity.Nominee;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.enums.UserSchemeStatus;

public record UserPortfolio(
        String schemeId,
        String schemeName,
        Integer tenure,
        String payoutFrequency,
        Double profitPercentage,
        LocalDateTime enrollmentDate,
        String bondImageURL,
        String bondNumber,
        LocalDateTime requestDate,
        String userSchemeId,
        BigDecimal paidAmount,
        Boolean isApproved,
        BigDecimal profit,
        BigDecimal profitReedemed,
        LocalDate nextPayoutDate,
        LocalDate paidDate,
        UserSchemeStatus status,
        LocalDate maturityDate,
        NomineeResponse nominee,
        LocalDateTime update_on,
        BigDecimal minimumAmount,
        BigDecimal maximumAmount,
        String reinvestedIntoUserSchemeId) {

    public static UserPortfolio fromEntity(UserScheme us) {
        BigDecimal totalprofit = BigDecimal.ZERO;
        BigDecimal profitreedemed = BigDecimal.ZERO;
        List<UserSchemeProfitLedger> profitLedger = us.getProfitLedger();
        if (profitLedger != null) {
            profitLedger = new ArrayList<>(us.getProfitLedger());
            for (UserSchemeProfitLedger entry : profitLedger) {
                totalprofit = totalprofit.add(entry.getProfitAmount());
            }
        }
        List<UserSchemeReedemLedger> redeemProfit = us.getReedemLedger();
        if (redeemProfit != null) {
            for (UserSchemeReedemLedger entry : redeemProfit) {
                profitreedemed = profitreedemed.add(entry.getRedeemAmount());
            }
        }
        Scheme scheme = us.getScheme();
        Nominee nominee = us.getNominee();
        return new UserPortfolio(
                scheme.getSchemeId(),
                scheme.getSchemeName(),
                scheme.getTenure(),
                scheme.getPayoutFrequency(),
                scheme.getProfitPercentage(),
                us.getEnrollmentDate(),
                us.getBondImageURL(),
                us.getBondNumber(),
                us.getRequestDate(),
                us.getUserSchemeId(),
                us.getPaidAmount(),
                us.getIsApproved(),
                totalprofit,
                profitreedemed,
                us.getNextPayoutDate(),
                us.getPaidDate(), us.getStatus(),
                us.getMaturityDate(),
                nominee != null ? NomineeResponse.fromEntity(nominee) : null,
                us.getUpdatedAt(),
                scheme.getMinimumAmount(),
                scheme.getMaximumAmount(),
                us.getReinvestedIntoUserSchemeId());
    }

}