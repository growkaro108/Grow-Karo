package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.Transaction.TransactionStatus;
import com.growkaro.backend.entity.Transaction.TransactionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {

    private String id;
    private LocalDateTime date;
    private String description;
    private String type; // "Credit" | "Debit" (frontend-friendly)
    private BigDecimal amount;
    private BigDecimal penaltyAmount;
    private BigDecimal netAmount;
    private String status; // "Completed" | "Pending" | "Failed" | "Refunded"
    private String failureReason;
    private String bankName;
    private String bankLast4;
    private LocalDateTime updatedAt;

    public static TransactionResponse fromEntity(Transaction txn) {
        return TransactionResponse.builder()
                .id(txn.getId())
                .date(txn.getCreatedAt())
                .description(buildDescription(txn))
                .type(mapType(txn.getType()))
                .amount(txn.getAmount())
                .penaltyAmount(txn.getPenaltyAmount())
                .netAmount(txn.getAmount().subtract(
                        txn.getPenaltyAmount() != null ? txn.getPenaltyAmount() : BigDecimal.ZERO))
                .status(mapStatus(txn.getStatus()))
                .failureReason(txn.getStatus() == TransactionStatus.FAILED
                        ? txn.getFailureReason()
                        : null)
                .bankName(txn.getBankDetails() != null ? txn.getBankDetails().getBankName() : null)
                .bankLast4(maskAccount(txn.getBankDetails()))
                .updatedAt(txn.getUpdatedAt())
                .build();
    }

    private static String buildDescription(Transaction txn) {
        if (txn.getSchemeName() != null) {
            return txn.getType() == TransactionType.DEPOSIT
                    ? "Deposit - " + txn.getSchemeName()
                    : "Withdrawal - " + txn.getSchemeName();
        }
        return txn.getType().name().replace("_", " ");
    }

    private static String mapType(TransactionType type) {
        return type == TransactionType.DEPOSIT ? "Credit" : "Debit";
    }

    private static String mapStatus(TransactionStatus status) {
        return switch (status) {
            case PENDING -> "Pending";
            case SUCCESS -> "Completed";
            case FAILED -> "Failed";
            case REJECTED -> "Rejected";
            case PROCESSED -> "Processed";
            case REFUNDED -> "Refunded";
        };
    }

    private static String maskAccount(com.growkaro.backend.entity.BankDetails bd) {
        if (bd == null || bd.getAccountNumber() == null)
            return null;
        String acc = bd.getAccountNumber();
        return acc.length() > 4
                ? "XXXX" + acc.substring(acc.length() - 4)
                : acc;
    }
}