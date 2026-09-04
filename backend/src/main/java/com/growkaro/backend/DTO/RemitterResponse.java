package com.growkaro.backend.DTO;

import com.growkaro.backend.entity.Remitter;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RemitterResponse(

        String id,
        String token,

        String RemitterEmail,
        String RemitterPhone,
        String remitterCode,

        String organizationName,
        BigDecimal allocationLimit,
        BigDecimal totalPaid,
        String aadharNumber,
        String panNumber,
        boolean status,
        int totalUsers,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    // private String gstNumber;
    /** Masked, e.g. "ABCDE****F" — full value is never sent to the client. */

    /** Masked, e.g. "XXXX XXXX 9012" — full value is never sent to the client. */

    public static RemitterResponse fromEntity(Remitter r, String token) {
        return new RemitterResponse(r.getRemitterId(), token, r.getRemitterEmail(),
                r.getRemitterPhone(), r.getRemitterCode(),
                r.getOrganizationName(), r.getAllocationLimit(), r.getTotalPaid(), maskAadhar(r.getAadharNumber()),
                maskPan(r.getPanNumber()), r.getStatus(), r.getUsers().size(), r.getCreatedAt(), r.getUpdatedAt());

        // dto.setId(remitter.getRemitterId());
        // dto.setToken(token);

        // dto.setOrganizationName(remitter.getOrganizationName());
        // dto.setPanNumber(remitter.getPanNumber());
        // dto.setAadharNumber(remitter.getAadharNumber());
        // dto.setRemitterEmail(remitter.getRemitterEmail());
        // dto.setRemitterPhone(remitter.getRemitterPhone());
        // dto.setRemitterCode(remitter.getRemitterCode());
        // dto.setAllocationLimit(remitter.getAllocationLimit());
        // dto.setTotalPaid(remitter.getTotalPaid());
        // dto.setTotalUsers(remitter.getUsers().size());
        // dto.setStatus(remitter.getStatus());
        // dto.setCreatedAt(remitter.getCreatedAt());
        // dto.setUpdatedAt(remitter.getUpdatedAt());

        
    }

    // for general response to admin
    public static RemitterResponse fromEntity(Remitter r) {
        return new RemitterResponse(r.getRemitterId(), null, r.getRemitterEmail(),
                r.getRemitterPhone(), r.getRemitterCode(),
                r.getOrganizationName(), r.getAllocationLimit(), r.getTotalPaid(), maskAadhar(r.getAadharNumber()),
                maskPan(r.getPanNumber()), r.getStatus(), r.getUsers().size(), r.getCreatedAt(), r.getUpdatedAt());
        
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