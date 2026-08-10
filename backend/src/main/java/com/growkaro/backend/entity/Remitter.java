package com.growkaro.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Getter
@Setter
@Entity
@Table(name = "remitters")
public class Remitter {

    @Id
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String organizationName;

    // private String gstNumber;

    @Column(nullable = false)
    private String panNumber;

    @Column(nullable = false)
    private String aadharNumber;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal allocationLimit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = getTime();
    }

    public enum Status {
        ACTIVE, INACTIVE
    }

    @PrePersist
    private void setId() {
        this.id = "GKRID-"
                + LocalDateTime.now(ZoneId.of("Asia/Kolkata")).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        this.createdAt = getTime();
    }

    private LocalDateTime getTime() {
        return LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }

}