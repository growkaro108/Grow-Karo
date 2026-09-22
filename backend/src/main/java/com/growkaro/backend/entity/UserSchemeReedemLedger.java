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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import org.hibernate.envers.Audited;


@Getter
@Setter
@NoArgsConstructor
@Audited
@Entity
@ToString(exclude="userScheme")
@Table(name = "user_scheme_reedem_ledger")
public class UserSchemeReedemLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_scheme_id", nullable = false)
    private UserScheme userScheme;

    @NotNull
    @DecimalMin("0.0000")
    @Column(name = "redeem_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal redeemAmount = BigDecimal.ZERO;

    @Column(name = "redeem_date")
    private LocalDate redeemDate;
}
