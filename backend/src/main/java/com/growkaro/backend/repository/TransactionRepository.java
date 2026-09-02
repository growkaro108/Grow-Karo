package com.growkaro.backend.repository;

import com.growkaro.backend.DTO.TransactionSummary;
import com.growkaro.backend.entity.Transaction;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.Transaction.TransactionStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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

    List<Transaction> findAllByRemitter_RemitterIdAndStatus(String remitterId, TransactionStatus status);

    Page<Transaction> findByRemitter_RemitterId(String remitterId, Pageable pageable);

    // fetch all user and its transaction in which status is success and remiiter is
    // this
    @Query("SELECT t FROM Transaction t " +
            "WHERE t.remitter.remitterId = :remitterId And t.status = 'SUCCESS'" +
            "ORDER BY t.createdAt DESC")
    List<Transaction> findAllByRemitter_RemitterId(@Param("remitterId") String remitterId);

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

    // ── Overview dashboard queries ────────────────────────────────────────────

    /** Daily inflow (DEPOSIT, SUCCESS) for the last N days, newest first. */
    @Query("""
            SELECT CAST(t.createdAt AS LocalDate) AS day,
                   COALESCE(SUM(t.amount), 0)     AS amount
            FROM Transaction t
            WHERE t.type = 'DEPOSIT'
              AND t.status = 'SUCCESS'
              AND t.createdAt >= :since
            GROUP BY CAST(t.createdAt AS LocalDate)
            ORDER BY CAST(t.createdAt AS LocalDate) ASC
            """)
    List<Map<String, Object>> findDailyInflow(@Param("since") LocalDateTime since);

    /** Count of transactions per status (PENDING, SUCCESS, …). */
    @Query("""
            SELECT t.status AS status, COUNT(t) AS count
            FROM Transaction t
            GROUP BY t.status
            """)
    List<Map<String, Object>> findStatusBreakdown();

    /** Total pending withdrawal amount. */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.status = 'PENDING' AND t.type <> 'DEPOSIT'")
    BigDecimal sumPendingWithdrawalAmount();

    /** Count of pending withdrawals. */
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = 'PENDING' AND t.type <> 'DEPOSIT'")
    long countPendingWithdrawals();

}
