package com.growkaro.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.growkaro.backend.enums.PaymentMode;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

public class ExtraReedeemDetails {

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode")
    private PaymentMode paymentMode;

    @Column(name = "transaction_ref", unique = true, length = 64)
    private String transactionRef; // null for cash, never ""

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "sender_bank_account_id")
    private String senderBankAccountId;

    @Column(name = "user_bank_account_id")
    private String userBankAccountId;

    @Column(name = "user_upi_id")
    private String userUpiId;

    @Column(name = "received_by", length = 100)
    private String receivedBy; // cash only

    @Column(name = "proof_file_key")
    private String proofFileKey;

    @Column(name = "proof_content_type", length = 50)
    private String proofContentType;

    @Column(name = "settled_by")
    private String settledBy;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(name = "remarks", length = 300)
    private String remarks;

    
}
