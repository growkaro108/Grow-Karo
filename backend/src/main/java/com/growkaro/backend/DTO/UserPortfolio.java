package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

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
        BigDecimal maturityAmount,
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
        String reinvestedIntoUserSchemeId,
        String planType,
        Integer tenureMonths,
        BigDecimal contractInterestAmount,
        List<UserSchemeProfitLedgerResponse> profitLedger,
        List<DailyDepositResponse> dailyDepositLedger) {

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
        boolean isPension = "PENSION".equalsIgnoreCase(scheme.getPlanType());
        Double profitPercentage = isPension && us.getContractTotalInterestPercentage() != null
                ? us.getContractTotalInterestPercentage()
                : scheme.getProfitPercentage();
        Integer tenureMonths = isPension && us.getContractTenureDays() != null
                ? us.getContractTenureDays()
                : scheme.getTenureMonths();
        Integer tenure = isPension && us.getPaidDate() != null && us.getMaturityDate() != null
                ? Math.toIntExact(ChronoUnit.DAYS.between(us.getPaidDate(), us.getMaturityDate()))
                : scheme.getTenure();
        return new UserPortfolio(
                scheme.getSchemeId(),
                scheme.getSchemeName(),
                tenure,
                scheme.getPayoutFrequency(),
                profitPercentage,
                us.getEnrollmentDate(),
                us.getBondImageURL(),
                us.getBondPdfURL(),
                us.getBondNumber(),
                us.getRequestDate(),
                us.getUserSchemeId(),
                us.getPaidAmount(),
                general.calculateMaturityAmount(us),
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
                us.getReinvestedIntoUserSchemeId(),
                scheme.getPlanType(),
                tenureMonths,
                isPension ? general.calculatePensionInterestAmount(us.getPaidAmount(), profitPercentage, tenureMonths) : null,
                us.getProfitLedger().stream()
                        .map(entry -> new UserSchemeProfitLedgerResponse(
                                entry.getId(), entry.getProfitAmount(), entry.getProfitDate(), entry.isPaid()))
                        .toList(),
                IntStream.range(0, us.getDailyDepositLedger().size())
                        .mapToObj(index -> DailyDepositResponse.fromEntity(
                                us.getDailyDepositLedger().get(index), index))
                        .toList());
    }

}