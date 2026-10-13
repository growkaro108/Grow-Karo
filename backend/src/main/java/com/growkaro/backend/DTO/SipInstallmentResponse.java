package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.growkaro.backend.entity.SipInstallment;

public record SipInstallmentResponse(
        Integer installmentNumber,
        LocalDate installmentDate,
        LocalDate dueDate,
        LocalDate paidDate,
        BigDecimal dueAmount,
        BigDecimal paidAmount) {

    public static SipInstallmentResponse fromEntity(SipInstallment installment, int index) {
        return new SipInstallmentResponse(
                index + 1,
                installment.getInstallmentDate(),
                installment.getDueDate(),
                installment.getPaidDate(),
                installment.getDueAmount(),
                installment.getPaidAmount());
    }
}
