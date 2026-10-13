package com.growkaro.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SipInstallment {

    @Column(name = "installment_date")
    private LocalDate installmentDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "due_amount", precision = 19, scale = 2)
    private BigDecimal dueAmount;

    @Column(name = "paid_amount", precision = 19, scale = 2)
    private BigDecimal paidAmount;
}
