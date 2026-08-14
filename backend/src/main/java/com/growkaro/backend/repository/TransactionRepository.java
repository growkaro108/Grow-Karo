package com.growkaro.backend.repository;

import com.growkaro.backend.DTO.TransactionSummary;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.Transaction.TransactionStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    @Query("SELECT " +
            "COALESCE(SUM(CASE WHEN t.status = 'PENDING' THEN t.amount ELSE 0 END), 0) AS pendingSum, " +
            "COALESCE(SUM(CASE WHEN t.status = 'SUCCESS' THEN t.amount ELSE 0 END), 0) AS successSum " +
            "FROM Transaction t WHERE t.user.id = :userId")
    TransactionSummary getTransactionSummaryByUser(@Param("userId") String userId);
    // ── Per-user queries ─────────────────────────────────────────────────────

    List<Transaction> findByUser_IdOrderByCreatedAtDesc(String userId);

    Page<Transaction> findByStatus(TransactionStatus pending, Pageable pageable);

    Page<Transaction> findByStatusIn(List<TransactionStatus> statuses, Pageable pageable);

    Page<Transaction> findAll(Pageable pageable); // already provided by JpaRepository

    long countByRemitter_RemitterIdAndStatus(String remitterId, TransactionStatus status);
    // Page<Transaction> findByUserIdAndStatus(String userId, Transaction.Status
    // status, Pageable pageable);

    // List<Transaction> findByUserIdAndCreatedAtBetween(String userId,
    // LocalDateTime from, LocalDateTime to);

    // ── Per-remitter queries ─────────────────────────────────────────────────

    // Page<Transaction> findByRemitterIdAndStatus(String remitterId,
    // Transaction.Status status, Pageable pageable);

    // ── Status filters ───────────────────────────────────────────────────────

    // Page<Transaction> findByStatus(Transaction.Status status, Pageable pageable);

    // long countByStatus(Transaction.Status status);

    // ── Aggregates for dashboards ─────────────────────────────────────────────

    // @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id
    // = :userId AND t.status = 'SUCCESS'")
    // BigDecimal sumSuccessfulAmountByUser(@Param("userId") String userId);

    // @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status =
    // 'SUCCESS' AND t.createdAt BETWEEN :from AND :to")
    // BigDecimal sumSuccessfulAmountBetween(@Param("from") LocalDateTime from,
    // @Param("to") LocalDateTime to);

    // ── Count stats ───────────────────────────────────────────────────────────

    // long countByUserId(String userId);

    // long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // ── Reference ID lookup ───────────────────────────────────────────────────

}
