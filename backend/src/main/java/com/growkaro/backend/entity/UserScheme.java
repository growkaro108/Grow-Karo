package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = { "user", "scheme" }) // Avoid infinite loops in toString()
@Entity
@Table(name = "user_schemes", uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id", "scheme_id" }) })
public class UserScheme {

    @Id
    @Column(name = "user_scheme_id")
    private String userSchemeId;

    @Column(name = "request_date", nullable = false, updatable = false)
    private LocalDate requestDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference(value = "user-schemes") // Breaks circular JSON serialization if User tracks UserSchemes
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheme_id", nullable = false)
    @JsonBackReference // CRITICAL: Pairs with @JsonManagedReference in Scheme to fix the Nesting Depth
    private Scheme scheme;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    @DecimalMin(value = "0.0000", message = "Paid Amount cannot be negative")
    @Column(name = "paid_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    // after approve by admin
    @OneToOne(mappedBy = "userScheme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY, optional = true)
    private UserApproved userApproved;

    // @Column(name = "status", nullable = false)
    // private UserSchemeStatus status = UserSchemeStatus.PENDING;

    // @Column(name = "payment_date", nullable = true)
    // private LocalDate paymentDates;

    // @Column(name = "remaining_amount", nullable = true)
    // private Long remainingAmount;

    // @Column(name = "bond_price", nullable = true)
    // private Long bondPrice;

    // @Column(name = "bond_maturity_date", nullable = true)
    // private LocalDate bondMaturityDate;

    // @Column(name = "bond_maturity_value", nullable = true)
    // private BigDecimal bondMaturityValue;

    // public enum UserSchemeStatus {
    // PENDING,
    // ACTIVE,
    // // REJECTED,
    // // WITHDRAWN
    // }

    @PrePersist
    protected void onCreate() {
        if (this.requestDate == null && this.userSchemeId == null) {
            LocalDate now = LocalDate.now();
            this.requestDate = now;
            this.userSchemeId = "GKUSID" + now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof UserScheme))
            return false;
        UserScheme that = (UserScheme) o;
        return userSchemeId != null && Objects.equals(userSchemeId, that.userSchemeId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // generate meaningfull userScheme Id
    @PrePersist
    private void generateUserSchemeId() {

    }
}