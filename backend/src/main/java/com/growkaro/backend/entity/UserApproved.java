package com.growkaro.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Entity
@Table(name = "user_approved")
public class UserApproved {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approved_id", nullable = false)
    private Long approvedId;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "enrollment_date", nullable = true)
    private LocalDateTime enrollmentDate;

    @Column(name = "bond_image_url", nullable = true)
    private String bondImageURL;

    @Column(name = "bond_number", nullable = true)
    private String bondNumber;

    @DecimalMin(value = "0.0000", message = "Profit cannot be negative")
    @Column(name = "profit", nullable = false)
    private BigDecimal profit = BigDecimal.ZERO;

    @Column(name = "next_payout_date", nullable = false)
    private LocalDate nextPayoutDate;
}
