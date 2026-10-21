package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.IntStream;

import com.growkaro.backend.DTO.SipInstallmentResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeReedemLedger;

public record UserSchemeResponse(
                String userSchemeId,
                String schemeName,
                String schemeDetails,
                Integer tenure,
                Double profitPercentage,
                String status,
                BigDecimal paidAmount,
                BigDecimal maturityAmount,
                BigDecimal profit,
                BigDecimal profitRedeemed,
                String paidDate,
                String requestDate,
                String enrollmentDate,
                String maturityDate,
                String bondUrl,
                String bondPdfUrl,
                String bondNumber,
                String payoutCycle,
                List<UserSchemeProfitLedgerResponse> profitLedger,
                List<UserSchemeReedemLedgerResponse> reedemLedger,
                NomineeResponse nominee,
                String planType,
                Integer tenureMonths,
                List<SipInstallmentResponse> sipLedger,
                BigDecimal minimumAmount,
                BigDecimal maximumAmount,
                BigDecimal contractInterestAmount) {
        private static final General GENERAL = new General();

        public static UserSchemeResponse toUserSchemeResponse(UserScheme us) {
                boolean isJoined = us.getEnrollmentDate() != null;

                List<UserSchemeProfitLedgerResponse> profitLedger = us.getProfitLedger().stream()
                                .map(entry -> new UserSchemeProfitLedgerResponse(
                                                entry.getId(), entry.getProfitAmount(), entry.getProfitDate(),
                                                entry.isPaid()))
                                .toList();
                BigDecimal profit = profitLedger.stream()
                                .map(UserSchemeProfitLedgerResponse::profitAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                List<UserSchemeReedemLedgerResponse> reedemLedger = us.getReedemLedger().stream()
                                .map(entry -> new UserSchemeReedemLedgerResponse(
                                                entry.getId(), entry.getRedeemAmount(), entry.getRedeemDate()))
                                .toList();
                boolean isPension = "PENSION".equalsIgnoreCase(us.getScheme().getPlanType());
                BigDecimal profitRedeemed = isPension
                                ? GENERAL.countCompletedPensionInterestRedeemed(us)
                                : reedemLedger.stream()
                                                .map(UserSchemeReedemLedgerResponse::redeemAmount)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                Scheme s = us.getScheme();
                BigDecimal maturityAmount = GENERAL.calculateMaturityAmount(us);
                Double profitPercentage = isPension && us.getContractTotalInterestPercentage() != null
                                ? us.getContractTotalInterestPercentage()
                                : s.getProfitPercentage();
                Integer tenureMonths = isPension && us.getContractTenureMonths() != null
                                ? us.getContractTenureMonths()
                                : s.getTenureMonths();
                Integer tenure = isPension && us.getPaidDate() != null && us.getMaturityDate() != null
                                ? Math.toIntExact(ChronoUnit.DAYS.between(us.getPaidDate(), us.getMaturityDate()))
                                : s.getTenure();
                BigDecimal contractInterestAmount = isPension
                                ? GENERAL.calculatePensionInterestAmount(
                                                us.getPaidAmount(),
                                                profitPercentage, tenureMonths)
                                : null;
                return new UserSchemeResponse(
                                us.getUserSchemeId(),
                                s.getSchemeName(),
                                s.getSchemeDetails(),
                                tenure,
                                profitPercentage,
                                us.getStatus().toString().toLowerCase(),
                                us.getPaidAmount(),
                                maturityAmount,
                                profit,
                                profitRedeemed,
                                us.getPaidDate() == null ? null : us.getPaidDate().toString(),
                                us.getRequestDate().format(General.DATE_FORMATTER),
                                isJoined ? us.getEnrollmentDate().format(General.DATE_FORMATTER) : null,
                                isJoined ? us.getMaturityDate().format(General.DATE_FORMATTER) : null,
                                isJoined ? us.getBondImageURL() : null,
                                isJoined ? us.getBondPdfURL() : null,
                                us.getBondNumber(),
                                isJoined ? us.getScheme().getPayoutFrequency() : null,
                                profitLedger,
                                reedemLedger,
                                us.getNominee() == null ? null : NomineeResponse.fromEntity(us.getNominee()),
                                s.getPlanType(),
                                tenureMonths,
                                
                                IntStream.range(0, us.getSipLedger().size())
                                                .mapToObj(index -> SipInstallmentResponse.fromEntity(
                                                                us.getSipLedger().get(index), index))
                                                .toList(),
                                s.getMinimumAmount(),
                                s.getMaximumAmount(),
                                contractInterestAmount);
        }

}
