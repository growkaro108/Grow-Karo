package com.growkaro.backend.DRO;

import java.time.LocalDate;

public record AdminUserProfileUpdateRequest(
        String name,
        String phone,
        LocalDate dob,
        String maritalStatus,
        String aadharNo,
        String address,
        String guardianName,
        String guardianRelation,
        String bankName,
        String accountNumber,
        String ifscCode,
        String accountHolderName,
        Boolean active) {
}
