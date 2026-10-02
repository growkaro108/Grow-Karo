package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Nominee;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.UserSchemeStatus;

public record UserPortfolio(
        String schemeId,
        String schemeName,
        Integer tenure,
        String payoutFrequency,
        Double profitPercentage,
        LocalDateTime enrollmentDate,
        String bondImageURL,
        String bondPdfUrl,
        String bondNumber,
        LocalDateTime requestDate,
        String userSchemeId,
        BigDecimal paidAmount,
        Boolean isApproved,
        BigDecimal profit,
        BigDecimal profitReedemed,
        BigDecimal schemeRedeem,
        BigDecimal pendingSchemeRedeem,
        BigDecimal pendingSchemeInterestRedeem,
        LocalDate nextPayoutDate,
        LocalDate paidDate,
        UserSchemeStatus status,
        LocalDate maturityDate,
        NomineeResponse nominee,
        LocalDateTime update_on,
        BigDecimal minimumAmount,
        BigDecimal maximumAmount,
        String reinvestedIntoUserSchemeId) {

    public static final General general = new General();

    public static UserPortfolio fromEntity(UserScheme us) {
        Map<String, BigDecimal> profitAndReeemedProfit = general.countTotalProfitAndRedeemAndFinalAmount(us);
        BigDecimal totalprofit = profitAndReeemedProfit.get("totalProfit");
        BigDecimal profitreedemed = profitAndReeemedProfit.get("totalReedem");
        BigDecimal pendingSchemeInterestRedeem = profitAndReeemedProfit.get("pendingSchemeInterestRedeem");
        BigDecimal schemeRedeem = profitAndReeemedProfit.get("schemeRedeem");
        BigDecimal pendingSchemeRedeem = profitAndReeemedProfit.get("pendingSchemeRedeem");
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
                us.getBondPdfURL(),
                us.getBondNumber(),
                us.getRequestDate(),
                us.getUserSchemeId(),
                us.getPaidAmount(),
                us.getIsApproved(),
                totalprofit,
                profitreedemed,
                schemeRedeem,
                pendingSchemeRedeem,
                pendingSchemeInterestRedeem,
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