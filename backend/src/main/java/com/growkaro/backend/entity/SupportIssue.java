package com.growkaro.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Entity
@Getter
@Setter
@Table(name = "support_issues")
public class SupportIssue {

    @Id
    private String id;

    @Column(nullable = false)
    private String submitterId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    private String resolvedBy;

    private String resolutionNote;

    private LocalDateTime resolvedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        LocalDateTime indianTimeZone = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        this.updatedAt = indianTimeZone;
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime indianTimeZone = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        if (this.id == null) {
            this.id = "GKUISU" + indianTimeZone.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        }
        this.createdAt = indianTimeZone;
        this.updatedAt = indianTimeZone;
    }

    public enum Status {
        OPEN, IN_PROGRESS, RESOLVED, CLOSED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

}
