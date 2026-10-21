package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.growkaro.backend.enums.UserSchemeStatus;

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
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.OneToMany;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = { "user", "scheme", "profitLedger", "reedemLedger", "sipLedger" })
@Entity
@Table(name = "user_schemes", indexes = {
        @Index(name = "idx_user_scheme_id", columnList = "userSchemeId"),
// @Index(name = "idx_user_scheme_user_id", columnList = "userId"),
// @Index(name = "idx_activity_type", columnList = "type")
})
@Audited
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
    @JsonBackReference("scheme-joined-users")
    private Scheme scheme;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0000", message = "Paid Amount cannot be negative")
    @Column(name = "paid_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "contract_total_interest_percentage")
    private Double contractTotalInterestPercentage;

    @Column(name = "contract_tenure_months")
    private Integer contractTenureMonths;

    @Column(name = "amount_from")
    private String amountFrom;

    @Column(name = "submit_to")
    private String submitTo;

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

    @Column(name = "bond_pdf_url")
    private String bondPdfURL;

    @Column(name = "bond_number")
    private String bondNumber;

    @Column(name = "last_profit_update_date")
    private LocalDate lastProfitUpdateDate;

    @OneToMany(mappedBy = "userScheme", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserSchemeProfitLedger> profitLedger = new ArrayList<>();

    @OneToMany(mappedBy = "userScheme", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserSchemeReedemLedger> reedemLedger = new ArrayList<>();

    @NotAudited
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_scheme_installments", joinColumns = @JoinColumn(name = "user_scheme_id"))
    @OrderColumn(name = "position")
    private List<SipInstallment> sipLedger = new ArrayList<>();

    @Column(name = "next_payout_date")
    private LocalDate nextPayoutDate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "maturity_notification_sent")
    @ColumnDefault("false")
    private Boolean maturityNotificationSent = false;

    @Column(name = "reinvested_into")
    private String reinvestedIntoUserSchemeId = null;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime indianTimezone = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        if (this.requestDate == null) {
            this.requestDate = indianTimezone;
        }
        if (this.userSchemeId == null) {
            this.userSchemeId = "GKUSID"
                    + indianTimezone
                            .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        }
    }

    @PostUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
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

    public UserScheme(String userSchemeId, LocalDateTime requestDate, User user, Nominee nominee, Scheme scheme, BigDecimal paidAmount, String amountFrom, String submitTo, Boolean isApproved, UserSchemeStatus status, LocalDateTime enrollmentDate, LocalDate paidDate, String bondImageURL, String bondPdfURL, String bondNumber, LocalDate lastProfitUpdateDate, List<UserSchemeProfitLedger> profitLedger, List<UserSchemeReedemLedger> reedemLedger, List<SipInstallment> sipLedger, LocalDate nextPayoutDate, LocalDate maturityDate, Boolean maturityNotificationSent, String reinvestedIntoUserSchemeId, LocalDateTime updatedAt) {
        this.userSchemeId = userSchemeId;
        this.requestDate = requestDate;
        this.user = user;
        this.nominee = nominee;
        this.scheme = scheme;
        this.paidAmount = paidAmount;
        this.amountFrom = amountFrom;
        this.submitTo = submitTo;
        this.isApproved = isApproved;
        this.status = status;
        this.enrollmentDate = enrollmentDate;
        this.paidDate = paidDate;
        this.bondImageURL = bondImageURL;
        this.bondPdfURL = bondPdfURL;
        this.bondNumber = bondNumber;
        this.lastProfitUpdateDate = lastProfitUpdateDate;
        this.profitLedger = profitLedger;
        this.reedemLedger = reedemLedger;
        this.sipLedger = sipLedger;
        this.nextPayoutDate = nextPayoutDate;
        this.maturityDate = maturityDate;
        this.maturityNotificationSent = maturityNotificationSent;
        this.reinvestedIntoUserSchemeId = reinvestedIntoUserSchemeId;
        this.updatedAt = updatedAt;
    }

}
