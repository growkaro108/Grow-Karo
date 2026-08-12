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

    private String RemitterEmail;
    private String RemitterPhone;

    private String organizationName;
    private BigDecimal allocationLimit;
    private BigDecimal totalPaid;
    private String aadharNumber;
    private String panNumber;
    private boolean status;
    private int totalUsers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // private String gstNumber;
    /** Masked, e.g. "ABCDE****F" — full value is never sent to the client. */

    /** Masked, e.g. "XXXX XXXX 9012" — full value is never sent to the client. */

    /**
     * Maps a Remitter entity to its response representation, masking
     * sensitive KYC identifiers along the way.
     */
    public static RemitterResponse fromEntity(Remitter remitter) {
        RemitterResponse dto = new RemitterResponse();

        dto.setId(remitter.getRemitterId());

        dto.setOrganizationName(remitter.getOrganizationName());
        // dto.setGstNumber(remitter.getGstNumber());
        dto.setPanNumber(remitter.getPanNumber());
        dto.setAadharNumber(remitter.getAadharNumber());
        dto.setRemitterEmail(remitter.getRemitterEmail());
        dto.setRemitterPhone(remitter.getRemitterPhone());
        dto.setAllocationLimit(remitter.getAllocationLimit());
        dto.setTotalPaid(remitter.getTotalPaid());
        dto.setTotalUsers(remitter.getUsers().size());
        dto.setStatus(remitter.getStatus());
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