package com.growkaro.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_transactions_user_id", columnList = "user_id"),
        @Index(name = "idx_transactions_user_status", columnList = "user_id, status")
})
public class Transaction {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitter_id")
    private Remitter remitter;

    // Gross amount requested (scheme amount for aggressive, typed amount for
    // general)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = true, length = 100)
    private String schemeName; // or @ManyToOne to a Scheme entity if schemes live in the DB

    // private String description;

    // Only populated for AGGRESSIVE_WITHDRAWAL
    @Column(precision = 12, scale = 2)
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    // amount - penaltyAmount; null for GENERAL_WITHDRAWAL and DEPOSIT
    // @Column(precision = 12, scale = 2)
    // private BigDecimal netAmount;

    // Bank details snapshot at time of request — not a live reference to the user's
    // profile
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_details_id")
    private BankDetails bankDetails;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_scheme_id", referencedColumnName = "user_scheme_id", nullable = false)
    private UserScheme userScheme;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionType type = TransactionType.GENERAL_WITHDRAWAL; // agrressive or general or deposit

    private String failureReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(length = 255, nullable = true)
    private String proofUrl;

    private LocalDateTime settlementDate;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum TransactionStatus {
        PENDING, PROCESSED, SUCCESS, FAILED, REFUNDED, REJECTED
    }

    public enum TransactionType {
        GENERAL_WITHDRAWAL,
        AGGRESSIVE_WITHDRAWAL,
        DEPOSIT
    }

    @PrePersist
    private void setId() {
        this.id = "TXN-" + LocalDateTime.now(ZoneId.of("Asia/Kolkata"))
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        this.createdAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        this.updatedAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }
}