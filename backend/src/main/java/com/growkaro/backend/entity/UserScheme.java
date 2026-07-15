package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = { "user", "scheme" }) // Avoid infinite loops in toString()
@Entity
@Table(name = "user_schemes", uniqueConstraints = { @UniqueConstraint(columnNames = { "user_id", "scheme_id" }) })
public class UserScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_scheme_id")
    private String userSchemeId;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_scheme_bond_images", joinColumns = @JoinColumn(name = "user_scheme_id", referencedColumnName = "user_scheme_id"))
    @Column(name = "image_url")
    private List<String> bondImageURL = new ArrayList<>();

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

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "status", nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "enrollment_date", nullable = true)
    private LocalDateTime enrollmentDate;

    @Column(name = "paid_amount", nullable = true)
    private Long paidAmount;

    @Column(name = "remaining_amount", nullable = true)
    private Long remainingAmount;

    @Column(name = "bond_number", nullable = true)
    private String bondNumber;

    @Column(name = "bond_image")
    private String bondImage;

    @Column(name = "bond_price", nullable = true)
    private Long bondPrice;

    @Column(name = "bond_maturity_date", nullable = true)
    private LocalDate bondMaturityDate;

    @Column(name = "bond_maturity_value", nullable = true)
    private Long bondMaturityValue;

    public enum Status {
        PENDING,
        ACTIVE,
        REJECTED,
        CLOSED,
        WITHDRAWN
    }

    @PrePersist
    protected void onCreate() {
        if (this.requestDate == null) {
            this.requestDate = LocalDate.now();
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
}