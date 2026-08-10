package com.growkaro.backend.DTO;

import com.growkaro.backend.entity.Remitter;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class RemitterResponse {

    private String id;

    private String userId;
    private String userName;
    private String userEmail;

    private String organizationName;
    // private String gstNumber;

    /** Masked, e.g. "ABCDE****F" — full value is never sent to the client. */
    private String panNumber;

    /** Masked, e.g. "XXXX XXXX 9012" — full value is never sent to the client. */
    private String aadharNumber;

    private String contactEmail;
    private String contactPhone;

    private BigDecimal allocationLimit;
    private String status; // "ACTIVE" | "PENDING" | "SUSPENDED"

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Maps a Remitter entity to its response representation, masking
     * sensitive KYC identifiers along the way.
     */
    public static RemitterResponse fromEntity(Remitter remitter) {
        RemitterResponse dto = new RemitterResponse();

        dto.setId(remitter.getId());

        if (remitter.getUser() != null) {
            dto.setUserId(remitter.getUser().getId());
            // Adjust getName()/getEmail() to whatever accessors your User entity exposes.
            dto.setUserName(remitter.getUser().getName());
            dto.setUserEmail(remitter.getUser().getEmail());
        }

        dto.setOrganizationName(remitter.getOrganizationName());
        // dto.setGstNumber(remitter.getGstNumber());
        dto.setPanNumber(maskPan(remitter.getPanNumber()));
        dto.setAadharNumber(maskAadhar(remitter.getAadharNumber()));
        dto.setContactEmail(remitter.getUser().getEmail());
        dto.setContactPhone(remitter.getUser().getPhone());
        dto.setAllocationLimit(remitter.getAllocationLimit());
        dto.setStatus(remitter.getStatus() != null ? remitter.getStatus().name() : null);
        dto.setCreatedAt(remitter.getCreatedAt());
        dto.setUpdatedAt(remitter.getUpdatedAt());

        return dto;
    }

    private static String maskPan(String pan) {
        if (pan == null || pan.length() < 10)
            return pan;
        // ABCDE1234F -> ABCDE****F
        return pan.substring(0, 5) + "****" + pan.substring(9);
    }

    private static String maskAadhar(String aadhar) {
        if (aadhar == null || aadhar.length() < 12)
            return aadhar;
        // 123456789012 -> XXXX XXXX 9012
        return "XXXX XXXX " + aadhar.substring(8);
    }
}