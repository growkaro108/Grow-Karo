package com.growkaro.backend.repository;

import com.growkaro.backend.entity.WithdrawalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, String> {

    // ── Per-user queries ─────────────────────────────────────────────────────

    Page<WithdrawalRequest> findByUserId(String userId, Pageable pageable);

    Page<WithdrawalRequest> findByUserIdAndStatus(String userId, WithdrawalRequest.Status status, Pageable pageable);

    // ── Admin queries ─────────────────────────────────────────────────────────

    Page<WithdrawalRequest> findByStatus(WithdrawalRequest.Status status, Pageable pageable);

    Page<WithdrawalRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ── Existence / guard ─────────────────────────────────────────────────────

    boolean existsByUserIdAndStatus(String userId, WithdrawalRequest.Status status);

    // ── Date range ────────────────────────────────────────────────────────────

    Page<WithdrawalRequest> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    // ── Aggregates for dashboard ──────────────────────────────────────────────

    long countByStatus(WithdrawalRequest.Status status);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") WithdrawalRequest.Status status);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.user.id = :userId AND w.status = 'PROCESSED'")
    BigDecimal sumProcessedAmountByUser(@Param("userId") String userId);
}
