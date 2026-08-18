package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "nominees")
public class Nominee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String nomineeId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 12)
    private String aadharNo;

    @Column(nullable = false, length = 20)
    private String mobileNo;

    @Column(nullable = false, length = 30)
    private String relation;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"guardian", "nominee", "bankDetails", "enrolledSchemes"})
    private User user;
}
