package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.util.List;

import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.UserScheme;

public record UserSchemeResponse(
        String userSchemeId,
        String schemeName,
        String schemeDetails,
        Double profitPercentage,
        String status,
        BigDecimal paidAmount,
        BigDecimal profit,
        BigDecimal profitRedeemed,
        BigDecimal redeemAmount,
        String redeemDate,
        String paidDate,
        String enrollmentDate,
        String maturityDate,
        String bondUrl,
        String bondNumber,
        String payoutCycle,
        List<UserSchemeProfitLedgerResponse> profitLedger,
        List<UserSchemeReedemLedgerResponse> reedemLedger,
        NomineeResponse nominee) {

    public static UserSchemeResponse toUserSchemeResponse(UserScheme us) {
        boolean isJoined = us.getEnrollmentDate() != null;

        BigDecimal redeemAmount = us.getRedeemAmount() != null ? us.getRedeemAmount() : BigDecimal.ZERO;

        boolean hasRedeemAmount = redeemAmount.signum() > 0;
        boolean hasRedeemDate = us.getRedeemDate() != null;

        List<UserSchemeProfitLedgerResponse> profitLedger = us.getProfitLedger().stream()
                .map(entry -> new UserSchemeProfitLedgerResponse(
                        entry.getId(), entry.getProfitAmount(), entry.getProfitDate()))
                .toList();
        BigDecimal profit = profitLedger.stream()
                .map(UserSchemeProfitLedgerResponse::profitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<UserSchemeReedemLedgerResponse> reedemLedger = us.getReedemLedger().stream()
                .map(entry -> new UserSchemeReedemLedgerResponse(
                        entry.getId(), entry.getRedeemAmount(), entry.getRedeemDate()))
                .toList();
        BigDecimal profitRedeemed = reedemLedger.stream()
                .map(UserSchemeReedemLedgerResponse::redeemAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new UserSchemeResponse(
                us.getUserSchemeId(),
                us.getScheme().getSchemeName(),
                us.getScheme().getSchemeDetails(),
                us.getScheme().getProfitPercentage(),
                us.getStatus().toString().toLowerCase(),
                us.getPaidAmount(),
                profit,
                profitRedeemed,
                hasRedeemAmount ? us.getRedeemAmount() : null,
                hasRedeemDate ? us.getRedeemDate().toString() : null,
                us.getPaidDate() == null ? null : us.getPaidDate().toString(),
                isJoined ? us.getEnrollmentDate().format(General.DATE_FORMATTER) : null,
                isJoined ? us.getMaturityDate().format(General.DATE_FORMATTER) : null,
                isJoined ? us.getBondImageURL() : null,
                us.getBondNumber(),
                isJoined ? us.getScheme().getPayoutFrequency() : null,
                profitLedger,
                reedemLedger,
                us.getNominee() == null ? null : NomineeResponse.fromEntity(us.getNominee()));
    }

}
