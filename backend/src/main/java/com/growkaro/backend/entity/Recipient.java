package com.growkaro.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for the recipients grid: one entry per person the remitter
 * has sent money to, with every individual transfer nested inside.
 *
 * NOTE: this is a read-model DTO, not a JPA entity — records can't be
 * entities (no mutable state / no no-arg constructor), so keep it in
 * `dto`, not `entity`, to avoid confusion with your real JPA entities.
 */
public record Recipient(
        String userId,
        String name,
        String email,
        String phone,
        List<Transfer> transfers) {
    // must be public (or package-private at least) — a private nested type
    // can't be referenced from your service/controller/repository, and
    // Jackson can run into accessibility issues serializing it.
    public record Transfer(
            String transactionId,
            BigDecimal amount,
            LocalDateTime date,
            String bankName,
            String accountNumber,
            String ifscCode,
            String accountHolderName) {
    }

    /**
     * Total sent across all transfers to this recipient.
     * 
     * @JsonProperty needed: this is a derived method, not a record component,
     *               so Jackson won't include it in the response JSON without this
     *               annotation.
     */
    @JsonProperty
    public BigDecimal totalAmount() {
        return transfers.stream()
                .map(Transfer::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** How many times money has been sent to this recipient. */
    @JsonProperty
    public int transactionCount() {
        return transfers.size();
    }

    /**
     * Bank name from the most recent transfer — shown as "payment method" on the
     * card.
     */
    @JsonProperty
    public String paymentMethod() {
        return transfers.isEmpty() ? null : transfers.get(0).bankName();
        // relies on transfers being pre-sorted newest-first when this record is built
    }
}