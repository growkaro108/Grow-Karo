package com.growkaro.backend.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.growkaro.backend.entity.DailyDeposit;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;

class GeneralDailyDepositTest {
    private final General general = new General();

    @Test
    void calculatesProfitFromEachDepositDateAndTerm() {
        Scheme scheme = new Scheme();
        scheme.setPlanType("DAILY_DEPOSIT");
        scheme.setProfitPercentage(10.0);

        UserScheme userScheme = new UserScheme();
        userScheme.setScheme(scheme);
        userScheme.setPaidAmount(new BigDecimal("2000.00"));
        userScheme.setPaidDate(LocalDate.of(2026, 1, 1));
        userScheme.setMaturityDate(LocalDate.of(2026, 1, 11));
        userScheme.setReedemLedger(new ArrayList<>());
        userScheme.setDailyDepositLedger(List.of(
                new DailyDeposit(LocalDate.of(2026, 1, 1), new BigDecimal("1000.00")),
                new DailyDeposit(LocalDate.of(2026, 1, 6), new BigDecimal("1000.00"))));

        assertEquals(new BigDecimal("2150.00"), general.calculateMaturityAmount(userScheme));
    }

    @Test
    void returnsPrincipalWhenNoDepositLedgerIsRecorded() {
        Scheme scheme = new Scheme();
        scheme.setPlanType("DAILY_DEPOSIT");

        UserScheme userScheme = new UserScheme();
        userScheme.setScheme(scheme);
        userScheme.setPaidAmount(new BigDecimal("1500.00"));
        userScheme.setReedemLedger(new ArrayList<>());

        assertEquals(new BigDecimal("1500.00"), general.calculateMaturityAmount(userScheme));
    }
}
