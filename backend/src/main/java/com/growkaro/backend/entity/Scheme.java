package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = "joinedUsers")
@Entity
@Table(name = "schemes", indexes = {
        @Index(name = "idx_scheme_status", columnList = "status"),
        @Index(name = "idx_scheme_category", columnList = "scheme_category")
})
public class Scheme {

    @Id
    @Column(name = "scheme_id")
    private String schemeId;

    @NotBlank(message = "Scheme name is required")
    @Column(name = "scheme_name", nullable = false)
    private String schemeName;

    @NotNull(message = "Minimum amount is required")
    @Positive(message = "Minimum amount must be greater than 0")
    @Column(name = "minimum_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal minimumAmount;

    @NotBlank(message = "Scheme category is required")
    @Column(name = "scheme_category", nullable = false)
    private String schemeCategory;

    @NotBlank(message = "Scheme details are required")
    @Column(name = "scheme_details", nullable = false, columnDefinition = "TEXT")
    private String schemeDetails;

    @NotBlank(message = "Payout frequency is required")
    @Column(name = "payout_frequency", nullable = false)
    private String payoutFrequency;

    @Column(name = "risk_level", nullable = false)
    private Byte riskLevel;

    @NotNull(message = "Tenure is required")
    @Positive(message = "Tenure must be greater than 0")
    @Column(name = "tenure", nullable = false)
    private Integer tenure;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @NotNull
    @Column(name = "status", nullable = false)
    private Boolean status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @NotNull(message = "Profit percentage is required")
    @PositiveOrZero(message = "Profit percentage cannot be negative")
    @Column(name = "profit_percentage", nullable = false)
    private Double profitPercentage;

    @Positive(message = "Max investors allowed must be greater than 0")
    @Column(name = "max_investors_allowed")
    private Integer maxInvestorsAllowed;

    @OneToMany(mappedBy = "scheme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonManagedReference
    private List<UserScheme> joinedUsers = new ArrayList<>();

    // --- Lifecycle Callbacks ---

    @PrePersist
    protected void onCreate() {
        this.schemeId = "GKSID" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    // --- Helper Methods for Defensive Association Management ---

    public void enrollUserInScheme(UserScheme userScheme) {
        userScheme.setScheme(this);
        this.joinedUsers.add(userScheme);
    }

    public void removeUserFromScheme(UserScheme userScheme) {
        this.joinedUsers.remove(userScheme);
        userScheme.setScheme(null);
    }

    // --- Safe Equals & HashCode Implementation ---
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Scheme scheme))
            return false;
        return schemeId != null && Objects.equals(schemeId, scheme.schemeId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}