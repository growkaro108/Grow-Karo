package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.util.List;

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

}
