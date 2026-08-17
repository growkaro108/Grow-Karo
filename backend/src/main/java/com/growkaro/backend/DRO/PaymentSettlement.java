package com.growkaro.backend.DRO;

import java.math.BigDecimal;

import org.springframework.web.multipart.MultipartFile;

public record PaymentSettlement(
        String remitterId,
        String txnId,
        BigDecimal amount,
        MultipartFile file
// ,String remitterMessage
) {

}
