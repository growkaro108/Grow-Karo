package com.growkaro.backend.repository;

import com.growkaro.backend.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    // ── Per-user queries ─────────────────────────────────────────────────────

    Page<Transaction> findByUserId(String userId, Pageable pageable);

    Page<Transaction> findByUserIdAndStatus(String userId, Transaction.Status status, Pageable pageable);

    List<Transaction> findByUserIdAndCreatedAtBetween(String userId, LocalDateTime from, LocalDateTime to);

    // ── Per-remitter queries ─────────────────────────────────────────────────

    Page<Transaction> findByRemitterId(String remitterId, Pageable pageable);

    Page<Transaction> findByRemitterIdAndStatus(String remitterId, Transaction.Status status, Pageable pageable);

    List<Transaction> findByRemitterIdAndCreatedAtBetween(String remitterId, LocalDateTime from, LocalDateTime to);

    // ── Status filters ───────────────────────────────────────────────────────

    Page<Transaction> findByStatus(Transaction.Status status, Pageable pageable);

    long countByStatus(Transaction.Status status);

    // ── Aggregates for dashboards ─────────────────────────────────────────────

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.status = 'SUCCESS'")
    BigDecimal sumSuccessfulAmountByUser(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.remitter.id = :remitterId AND t.status = 'SUCCESS'")
    BigDecimal sumSuccessfulAmountByRemitter(@Param("remitterId") String remitterId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = 'SUCCESS' AND t.createdAt BETWEEN :from AND :to")
    BigDecimal sumSuccessfulAmountBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // ── Count stats ───────────────────────────────────────────────────────────

    long countByUserId(String userId);

    long countByRemitterId(String remitterId);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // ── Reference ID lookup ───────────────────────────────────────────────────

    java.util.Optional<Transaction> findByReferenceId(String referenceId);
}
