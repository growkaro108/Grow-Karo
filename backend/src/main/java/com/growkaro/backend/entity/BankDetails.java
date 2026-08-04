package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "bank_details")
public class BankDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String bank_details_id;

    @NotBlank(message = "Bank name is required")
    @Size(max = 60, message = "Bank name is too long")
    private String bankName;

    // Same pattern enforced on the frontend: 4 letters, a literal 0, then 6
    // alphanumeric chars
    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "IFSC code must be in a valid format, e.g. SBIN0001234")
    private String ifscCode;

    // Digits only, 9-18 chars — matches ACCOUNT_NUMBER_REGEX on the frontend
    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^\\d{9,18}$", message = "Account number must be 9 to 18 digits")
    private String accountNumber;

    // Letters, spaces, hyphens, apostrophes — matches NAME_REGEX on the frontend
    @NotBlank(message = "Account holder name is required")
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s.'-]{1,49}$", message = "Enter a valid name (letters only, 2-50 characters)")
    private String accountHolderName;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    @JsonIgnoreProperties("bankDetails") // Stops Jackson from looping back to bankDetails
    private User user;
}