package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.BankDetails;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.UserSchemeStatus;

public record NearMaturityUserSchemeResponse(
                String id,
                String userId,
                String userSchemId,
                String userName,
                String userEmail,
                String schemeId,
                String schemeName,
                String bondNumber,
                BigDecimal investmentAmount,
                BigDecimal maturityAmount,
                BigDecimal totalProfit,
                BigDecimal totalRedeemed,
                BigDecimal profitAvailable,
                String maturityDate,
                int daysRemaining,
                String bondImage,
                String enrollmentDate,
                String accountNumber,
                String ifsc,
                String accountHolderName,
                String bankName,
                String cust_id,
                boolean settlementPending) {

        private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        private static final General g = new General();

        public static NearMaturityUserSchemeResponse fromUserScheme(UserScheme us) {
                User u = us.getUser();
                BankDetails bd = u.getBankDetails();
                Scheme s = us.getScheme();

                LocalDate maturityDate = us.getMaturityDate();
                LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
                int remainingDays = (int) ChronoUnit.DAYS.between(today, maturityDate);
                BigDecimal maturityAmount = g.calculateMaturityAmount(us);
                BigDecimal totalProfit = g.countProfit(us.getProfitLedger());
                BigDecimal totalRedeemed = g.countReedem(us.getReedemLedger());
                BigDecimal profitAvailable = totalProfit.subtract(totalRedeemed)
                                .max(BigDecimal.ZERO)
                                .min(maturityAmount.max(BigDecimal.ZERO));
                return new NearMaturityUserSchemeResponse(
                                us.getUserSchemeId(),
                                u.getId(),
                                us.getUserSchemeId(),
                                u.getName(),
                                u.getEmail(),
                                s.getSchemeId(),
                                s.getSchemeName(),
                                us.getBondNumber(),
                                us.getPaidAmount(),
                                maturityAmount,
                                totalProfit,
                                totalRedeemed,
                                profitAvailable,
                                maturityDate.format(DATE_FORMATTER),
                                remainingDays,
                                us.getBondImageURL(),
                                us.getEnrollmentDate().format(DATE_FORMATTER),
                                bd == null ? null : bd.getAccountNumber(),
                                bd == null ? null : bd.getIfscCode(),
                                bd == null ? null : bd.getAccountHolderName(),
                                bd == null ? null : bd.getBankName(),
                                g.getCustomerId(u.getId()),
                                us.getStatus() == UserSchemeStatus.SETTLEMENT_PENDING);
        }

}