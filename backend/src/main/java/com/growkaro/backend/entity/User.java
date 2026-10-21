package com.growkaro.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.envers.Audited;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@ToString(exclude = { "enrolledSchemes", "nominees", "bankDetails", "guardian", "passwordHash" })
@JsonIgnoreProperties({ "enrolledSchemes", "nominees", "bankDetails", "guardian" })
@NoArgsConstructor
@Entity
@Table(name = "users", indexes = { @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_id", columnList = "id") })
@Audited
public class User {

    @Id
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(updatable = false, nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    @JsonIgnore
    private String passwordHash;

    @Column
    private LocalDate dob;

    @Column(length = 30)
    private String maritalStatus;

    @Column(length = 12)
    private String aadharNo;

    @Column(length = 200)
    private String address;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY, optional = true)
    @JsonManagedReference(value = "user-bankDetails")
    private BankDetails bankDetails;

    @EqualsAndHashCode.Exclude
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY, optional = true)
    @JsonManagedReference(value = "user-guardian")
    private Guardian guardian;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-nominees")
    private List<Nominee> nominees = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-schemes")
    private List<UserScheme> enrolledSchemes = new ArrayList<>();

    // Helper method to handle defensive synchronization of the relationship
    public void enrollInScheme(UserScheme userScheme) {
        userScheme.setUser(this);
        this.enrolledSchemes.add(userScheme);
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.GRAHAK;

    // private String avatarUrl;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = false)
    private boolean phoneVerified = false;

    // Alerts
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean securityAlerts = true;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean schemeAlerts = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = getTime();

    private LocalDateTime updatedAt = getTime();

    @PrePersist
    protected void onCreate() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "GKUID" + getTime().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            this.updatedAt=getTime();
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = getTime();
    }

    public enum Role {
        GRAHAK, REMITTER, ADMIN
    }

    private LocalDateTime getTime() {
        return LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }

    public User(String id, String name, String email, String phone, String passwordHash, LocalDate dob, String maritalStatus, String aadharNo, String address, BankDetails bankDetails, Guardian guardian, List<Nominee> nominees, List<UserScheme> enrolledSchemes, Role role, boolean active, boolean emailVerified, boolean phoneVerified, boolean securityAlerts, boolean schemeAlerts, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.dob = dob;
        this.maritalStatus = maritalStatus;
        this.aadharNo = aadharNo;
        this.address = address;
        this.bankDetails = bankDetails;
        this.guardian = guardian;
        this.nominees = nominees;
        this.enrolledSchemes = enrolledSchemes;
        this.role = role;
        this.active = active;
        this.emailVerified = emailVerified;
        this.phoneVerified = phoneVerified;
        this.securityAlerts = securityAlerts;
        this.schemeAlerts = schemeAlerts;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


}