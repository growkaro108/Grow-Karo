package com.growkaro.backend.repository;

import com.growkaro.backend.entity.Remitter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RemitterRepository extends JpaRepository<Remitter, String> {

    // ── Lookup ───────────────────────────────────────────────────────────────

    Optional<Remitter> findByUserId(String userId);

    Optional<Remitter> findByGstNumber(String gstNumber);

    Optional<Remitter> findByPanNumber(String panNumber);

    // ── Existence checks ─────────────────────────────────────────────────────

    boolean existsByUserId(String userId);

    boolean existsByGstNumber(String gstNumber);

    boolean existsByPanNumber(String panNumber);

    // ── Status filters ───────────────────────────────────────────────────────

    Page<Remitter> findByStatus(Remitter.Status status, Pageable pageable);

    List<Remitter> findByStatus(Remitter.Status status);

    long countByStatus(Remitter.Status status);

    // ── Search ───────────────────────────────────────────────────────────────

    @Query("SELECT r FROM Remitter r WHERE " +
           "LOWER(r.organizationName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "r.gstNumber LIKE CONCAT('%', :query, '%') OR " +
           "r.panNumber LIKE CONCAT('%', :query, '%')")
    Page<Remitter> searchRemitters(@Param("query") String query, Pageable pageable);

    // ── Dashboard stats ──────────────────────────────────────────────────────

    @Query("SELECT COUNT(r) FROM Remitter r WHERE r.status = 'ACTIVE'")
    long countActive();

    @Query("SELECT COUNT(r) FROM Remitter r WHERE r.status = 'PENDING'")
    long countPending();
}
