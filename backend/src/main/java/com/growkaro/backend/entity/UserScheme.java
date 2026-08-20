package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.growkaro.backend.enums.UserSchemeStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = { "user", "scheme" }) // Avoid infinite loops in toString()
@Entity
@Table(name = "user_schemes"
// , uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id",
// "scheme_id" }) } /// for no duplicate entries
)
public class UserScheme {

    @Id
    @Column(name = "user_scheme_id")
    private String userSchemeId;

    @Column(name = "request_date", nullable = false, updatable = false)
    private LocalDateTime requestDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference(value = "user-schemes")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nominee_id")
    @JsonBackReference
    private Nominee nominee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheme_id", nullable = false)
    @JsonBackReference
    private Scheme scheme;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    @DecimalMin(value = "0.0000", message = "Paid Amount cannot be negative")
    @Column(name = "paid_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @ColumnDefault("'PENDING'")
    private UserSchemeStatus status = UserSchemeStatus.PENDING;

    @Column(name = "enrollment_date")
    private LocalDateTime enrollmentDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "bond_image_url")
    private String bondImageURL;

    @Column(name = "bond_number")
    private String bondNumber;

    @NotNull(message = "Profit is required")
    @DecimalMin(value = "0.0000", message = "Profit cannot be negative")
    @Column(name = "profit", precision = 19, scale = 4)
    private BigDecimal profit = BigDecimal.ZERO;

    @NotNull(message = "Profit Reedemed cannot be null")
    @DecimalMin(value = "0.0000", message = "Profit Reedemed cannot be negative")
    @Column(name = "profit_reedemed", precision = 19, scale = 4, nullable = false, columnDefinition = "NUMERIC(19,4) DEFAULT 0.0000")
    private BigDecimal profitReedemed = BigDecimal.ZERO;

    @Column(name = "next_payout_date")
    private LocalDate nextPayoutDate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @PrePersist
    protected void onCreate() {
        LocalDateTime indianTimezone = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        if (this.requestDate == null) {
            this.requestDate = indianTimezone;
        }
        if (this.userSchemeId == null) {
            this.userSchemeId = "GKUSID"
                    + LocalDateTime.now(ZoneId.of("Asia/Kolkata"))
                            .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof UserScheme that))
            return false;
        return userSchemeId != null && Objects.equals(userSchemeId, that.userSchemeId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}