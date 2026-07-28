package com.growkaro.backend.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public record UserRequest( // userScheme
        String userSchemeId,
        BigDecimal paidAmount,
        LocalDateTime paymentDates,
        Boolean isApproved,
        LocalDateTime requestDate,
        String bondImageURL,
        // scheme
        String schemeName,
        // user
        String name,
        String email,
        String phone) {
}
