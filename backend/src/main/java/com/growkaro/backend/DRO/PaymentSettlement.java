package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

public record PaymentSettlement(
        String remitterId,
        String txnId,
        BigDecimal amount,
        String paymentMode,
        LocalDate paymentDate,
        String transactionRef,
        String receivedBy,
        MultipartFile file
// ,String remitterMessage
) {

}
