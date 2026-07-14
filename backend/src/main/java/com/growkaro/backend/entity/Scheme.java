package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
@Table(name = "schemes")
public class Scheme {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "scheme_id")
    private String schemeId;

    @Column(name = "scheme_name", nullable = false)
    private String schemeName;

    @Column(name = "scheme_category", nullable = false)
    private String schemeCategory;

    @Column(name = "scheme_details", nullable = false, columnDefinition = "TEXT")
    private String schemeDetails;

    @Column(name = "payout_frequency", nullable = false)
    private String payoutFrequency;

    @Column(name = "tenure", nullable = false)
    private Integer tenure;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "status", nullable = false)
    private Boolean status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "investment_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal investmentAmount;

    @Column(name = "profit_percentage", nullable = false)
    private Double profitPercentage;

    @Column(name = "maturity_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal maturityValue;

    @Column(name = "max_investors_allowed")
    private Integer maxInvestorsAllowed;

    @OneToMany(mappedBy = "scheme", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonManagedReference
    private List<UserScheme> joinedUsers = new ArrayList<>();

    // --- Lifecycle Callbacks ---

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        // Fallback protection in case these were not manually set via builder
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Helper Methods for Defensive Association Management ---

    public void addJoinedUser(UserScheme userScheme) {
        if (this.joinedUsers == null) {
            this.joinedUsers = new ArrayList<>();
        }
        this.joinedUsers.add(userScheme);
        userScheme.setScheme(this);
    }

    public void removeJoinedUser(UserScheme userScheme) {
        if (this.joinedUsers != null) {
            this.joinedUsers.remove(userScheme);
            userScheme.setScheme(null);
        }
    }

    // --- Safe Equals & HashCode Implementation ---
    // Bypasses the "null ID equals null ID" trap for unsaved entities
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof Scheme))
            return false;
        Scheme scheme = (Scheme) o;
        return schemeId != null && Objects.equals(schemeId, scheme.schemeId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode(); // Guarantees consistency across states
    }
}