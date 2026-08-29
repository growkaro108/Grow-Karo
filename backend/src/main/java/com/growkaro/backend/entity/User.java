package com.growkaro.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@AllArgsConstructor
@JsonIgnoreProperties({"enrolledSchemes","nominees","bankDetails","guardian"})
@NoArgsConstructor
@Entity
@Table(name = "users")
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

    @Column(length = 120)
    private String street;

    @Column(length = 120)
    private String village;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String state;

    @Column(length = 10)
    private String pincode;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY, optional = true)
    @JsonManagedReference(value = "user-bankDetails")
    private BankDetails bankDetails;

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
        this.id = "GKUID" + getTime().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
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

}