package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyDepositRequest(LocalDate depositDate, BigDecimal depositAmount) {
}
