package com.growkaro.backend.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.util.ArrayList;

import org.junit.jupiter.api.Test;

import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger.ReedeemStatus;
import com.growkaro.backend.entity.UserSchemeReedemLedger.RedeemType;

class GeneralPensionTest {
    private final General general = new General();

    @Test
    void calculatesMonthlyAndTotalInterestFromPrincipalMonthlyRateAndTerm() {
        assertEquals(new BigDecimal("12000.00"),
                general.calculatePensionMonthlyInterestAmount(new BigDecimal("100000.00"), 12.0));
        assertEquals(new BigDecimal("288000.00"),
                general.calculatePensionInterestAmount(new BigDecimal("100000.00"), 12.0, 24));
    }

    @Test
    void countsOnlyPaidInterestScheduleRowsAsPaid() {
        UserScheme bond = new UserScheme();
        bond.setProfitLedger(new ArrayList<>());

        UserSchemeProfitLedger unpaid = new UserSchemeProfitLedger();
        unpaid.setProfitAmount(new BigDecimal("12000.00"));
        unpaid.setPaid(false);
        bond.getProfitLedger().add(unpaid);

        UserSchemeProfitLedger paid = new UserSchemeProfitLedger();
        paid.setProfitAmount(new BigDecimal("12000.00"));
        paid.setPaid(true);
        bond.getProfitLedger().add(paid);

        assertEquals(new BigDecimal("12000.00"), general.countPensionInterestRedeemed(bond));
    }

    @Test
    void pensionMaturityAmountIsPrincipalAndExcludesSettledPrincipal() {
        Scheme scheme = new Scheme();
        scheme.setPlanType("PENSION");
        UserScheme bond = new UserScheme();
        bond.setScheme(scheme);
        bond.setPaidAmount(new BigDecimal("100000.00"));
        bond.setReedemLedger(new ArrayList<>());

        assertEquals(new BigDecimal("100000.00"), general.calculateMaturityAmount(bond));

        UserSchemeReedemLedger interestPayout = new UserSchemeReedemLedger();
        interestPayout.setStatus(ReedeemStatus.COMPLETED);
        interestPayout.setRedeemType(RedeemType.INTEREST_REDEEM);
        interestPayout.setRedeemAmount(new BigDecimal("5000.00"));
        bond.getReedemLedger().add(interestPayout);

        assertEquals(new BigDecimal("100000.00"), general.calculateMaturityAmount(bond));
        assertEquals(new BigDecimal("5000.00"), general.countPensionInterestRedeemed(bond));

        UserSchemeReedemLedger partialPrincipalSettlement = new UserSchemeReedemLedger();
        partialPrincipalSettlement.setStatus(ReedeemStatus.COMPLETED);
        partialPrincipalSettlement.setRedeemType(RedeemType.PARTIAL_REDEEM);
        partialPrincipalSettlement.setRedeemAmount(new BigDecimal("25000.00"));
        bond.getReedemLedger().add(partialPrincipalSettlement);
        assertEquals(new BigDecimal("75000.00"), general.calculateMaturityAmount(bond));
        assertEquals(new BigDecimal("5000.00"),
                general.countTotalProfitAndRedeemAndFinalAmount(bond).get("totalReedem"));

        UserSchemeReedemLedger principalSettlement = new UserSchemeReedemLedger();
        principalSettlement.setStatus(ReedeemStatus.COMPLETED);
        principalSettlement.setRedeemType(RedeemType.MATURITY_WITHDRAWAL);
        principalSettlement.setRedeemAmount(new BigDecimal("75000.00"));
        bond.getReedemLedger().add(principalSettlement);

        assertEquals(new BigDecimal("0.00"), general.calculateMaturityAmount(bond));
    }
}
