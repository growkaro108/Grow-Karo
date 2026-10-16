package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaturitySettlementRequest(
        String action,
        String settlementType,
        BigDecimal amount,
        String remitterId,
        String paymentMode,
        LocalDate paymentDate,
        String transactionRef,
        String receivedBy,
        String remarks) {
}
