package com.growkaro.backend.DRO;

import com.growkaro.backend.entity.BankDetails;

public record WithdrawAmount(
        String userId,
        String schemeId,
        String amount,
        BankDetails bankDetails,
        Boolean isAggressive) {

}
