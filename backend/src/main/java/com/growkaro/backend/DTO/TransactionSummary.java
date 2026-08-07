package com.growkaro.backend.DTO;

import java.math.BigDecimal;

public interface TransactionSummary {
    BigDecimal getPendingSum();

    BigDecimal getSuccessSum();
}
