package com.growkaro.backend.DRO;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class AddRemitter {

    @NotBlank(message = "Remitter entity name is required")
    private String organizationName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String remitterEmail;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String remitterPhone;

    @NotBlank(message = "Aadhar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhar number must be exactly 12 digits")
    private String aadharNumber;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Enter a valid PAN (e.g. ABCDE1234F)")
    private String panNumber;

    // private String gstNumber; // optional

    @NotNull(message = "Allocation limit is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Allocation limit must be greater than 0")
    private BigDecimal allocationLimit;

    @NotNull(message = "Status is required")
    private Boolean status; // true = active, false = inactive — matches the frontend toggle
}