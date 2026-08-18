package com.growkaro.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "remitters")
public class Remitter {

    @Id
    private String remitterId;

    @NotBlank(message = "Organization name is required")
    @Column(nullable = false)
    private String organizationName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Column(updatable = false, nullable = false, unique = true)
    private String remitterEmail;

    @Column(nullable = false, unique = true, length = 10)
    private String remitterCode;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please provide a valid 10-digit phone number")
    @Column(nullable = false, unique = true, length = 10)
    private String remitterPhone;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal allocationLimit;

    // Was never initialized -> violated the NOT NULL constraint on first insert.
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Please provide a valid PAN number")
    @Column(nullable = false, unique = true, length = 10)
    private String panNumber;

    @NotBlank(message = "Aadhar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Please provide a valid 12-digit Aadhar number")
    @Column(nullable = false, unique = true, length = 12)
    private String aadharNumber;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private Boolean status = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "remitter_users", joinColumns = @JoinColumn(name = "remitter_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> users = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = getTime();
    }

    @PrePersist
    private void prePersist() {
        this.remitterId = "GKREMID-"
                + LocalDateTime.now(ZoneId.of("Asia/Kolkata")).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        this.createdAt = getTime();
        this.updatedAt = getTime();
        if (this.totalPaid == null) {
            this.totalPaid = BigDecimal.ZERO;
        }
        if (this.status == null) {
            this.status = true;
        }
    }

    private LocalDateTime getTime() {
        return LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }

}