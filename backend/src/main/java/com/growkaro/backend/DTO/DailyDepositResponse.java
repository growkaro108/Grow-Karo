package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.growkaro.backend.entity.DailyDeposit;

public record DailyDepositResponse(
        Integer depositNumber,
        LocalDate depositDate,
        BigDecimal depositAmount) {

    public static DailyDepositResponse fromEntity(DailyDeposit deposit, int index) {
        return new DailyDepositResponse(index + 1, deposit.getDepositDate(), deposit.getDepositAmount());
    }
}
