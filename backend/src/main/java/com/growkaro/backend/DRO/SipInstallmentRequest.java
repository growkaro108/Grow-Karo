package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SipInstallmentRequest(
        LocalDate installmentDate,
        LocalDate dueDate,
        LocalDate paidDate,
        BigDecimal dueAmount,
        BigDecimal paidAmount) {
}
