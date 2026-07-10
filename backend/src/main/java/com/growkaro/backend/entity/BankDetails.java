package com.growkaro.backend.entity;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bank_details")
public class BankDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String bank_details_id;
    private String bankName;

    private String ifscCode;

    private String accountNumber;

    private String accountHolderName;
}
