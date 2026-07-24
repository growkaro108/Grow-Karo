package com.growkaro.backend.DTO;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthUserData {
    String id;
    String name;
    String email;
    Boolean verified;
    String phone;
    String role;
    String token;
    int investedSchemeCount;
    Long totalInvestmentAmount;
    BigDecimal remainingPayments;
}
