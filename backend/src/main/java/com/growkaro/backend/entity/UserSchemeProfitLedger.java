package com.growkaro.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

@Getter
@Setter
@NoArgsConstructor
@Audited
@Entity
@Table(name = "user_scheme_profit_ledger", uniqueConstraints = @UniqueConstraint(name = "uk_user_scheme_profit_date", columnNames = {
        "profit_date" }))
public class UserSchemeProfitLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_scheme_id", nullable = false)
    private UserScheme userScheme;

    @NotNull
    @DecimalMin("0.0000")
    @Column(name = "profit_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal profitAmount = BigDecimal.ZERO;

    @NotNull
    @Column(name = "profit_date", nullable = false)
    private LocalDate profitDate;
}