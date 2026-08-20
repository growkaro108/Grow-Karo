package com.growkaro.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_receiver_read", columnList = "receiverId, receiverType, read"),
        @Index(name = "idx_notifications_created_at", columnList = "createdAt")
})
public class Notification {

    @Id
    @EqualsAndHashCode.Include
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReceiverType receiverType;

    @Column(nullable = false)
    private String receiverId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType notificationType = NotificationType.INFO;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private ActionType actionType;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(length = 500)
    private String actionUrl;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum NotificationType {
        INFO, SUCCESS, WARNING, PAYMENT, SYSTEM, LIMIT_UPDATED
    }

    public enum ReceiverType {
        Remitter, User
    }

    public enum ActionType {
        FUND_TRANSFER_INITIATED,
        FUND_TRANSFER_COMPLETED,
        WITHDRAWAL_REQUESTED,
        WITHDRAWAL_APPROVED,
        KYC_UPDATED,
        INVESTMENT_CONFIRMED,
        PAYMENT_FAILED,
        ALLOCATION_LIMIT_UPDATED
    }

    @PrePersist
    private void onCreate() {
        LocalDateTime indianTimezone = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        if (this.id == null) {
            String timestampPart = indianTimezone.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
            // String randomPart = UUID.randomUUID().toString().replace("-",
            // "").substring(0, 6).toUpperCase();
            this.id = "GKNID-" + timestampPart;
        }
        if (this.createdAt == null) {
            this.createdAt = indianTimezone;
        }
        if (this.updatedAt == null) {
            this.updatedAt = indianTimezone;
        }
    }

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }

}