package com.growkaro.backend.entity;

public record UserProfile(String id, String name, String email, String phone, String bankName, String accountNumber,
        String ifscCode, String accountHolderName, boolean securityAlerts,
        boolean schemeAlerts, String token,
        String bankDetailsId) {

}
