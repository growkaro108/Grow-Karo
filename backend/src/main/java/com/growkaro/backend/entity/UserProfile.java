package com.growkaro.backend.entity;

import java.math.BigDecimal;

public record UserProfile(String id, String name, String email, String phone, String bankName, String accountNumber,
        String ifscCode, String accountHolderName, boolean securityAlerts,
        boolean schemeAlerts, String token,
        int investedSchemeCount,
        BigDecimal totalInvestment,
        BigDecimal totalProfit,
        BigDecimal networth) {

}
