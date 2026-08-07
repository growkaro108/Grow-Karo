package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.growkaro.backend.entity.Transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTransactionResponse {

    private String id;
    private String userName;
    private String userEmail;
    private BigDecimal amount;
    private String method; // derived from bankDetails / UPI etc.
    private String status; // "pending" | "approved" | "rejected"
    private LocalDateTime requestedAt;

    public static AdminTransactionResponse fromEntity(Transaction txn) {
        return AdminTransactionResponse.builder()
                .id(txn.getId())
                .userName(txn.getUser().getName())
                .userEmail(txn.getUser().getEmail())
                .amount(txn.getAmount())
                .method(txn.getBankDetails() != null
                        ? txn.getBankDetails().getBankName()
                        : "N/A")
                .status(mapStatus(txn.getStatus()))
                .requestedAt(txn.getCreatedAt())
                .build();
    }

    private static String mapStatus(Transaction.TransactionStatus status) {
        return switch (status) {
            case PENDING -> "pending";
            case SUCCESS -> "approved";
            case FAILED, REJECTED -> "rejected";
            case REFUNDED -> "refunded";
        };
    }
}
