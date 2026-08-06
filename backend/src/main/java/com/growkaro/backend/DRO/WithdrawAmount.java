package com.growkaro.backend.DRO;

import java.math.BigDecimal;

import com.growkaro.backend.entity.BankDetails;

public record WithdrawAmount(
        String userId,
        String schemeId,
        String userSchemeId,
        BigDecimal amount,
        String bankDetailsId,
        Boolean isAggressive,
        BankDetails bankDetails) {

}
