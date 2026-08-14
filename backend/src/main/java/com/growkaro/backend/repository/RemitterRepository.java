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

        Page<Remitter> findAll(Pageable pageable);

        // login
        Optional<Remitter> findByRemitterEmail(String remitterEmail);

        Optional<Remitter> findByRemitterId(String remitterId);

        // // ── Existence checks ─────────────────────────────────────────────────────

        boolean existsByRemitterEmail(String remitterEmail);

        @Query("SELECT r FROM Remitter r WHERE r.remitterEmail = :email " +
                        "OR r.remitterPhone = :phone " +
                        "OR r.aadharNumber = :aadhar " +
                        "OR r.remitterCode = :remitterCode " +
                        "OR r.panNumber = :pan")
        List<Remitter> findConflicts(@Param("email") String email,
                        @Param("phone") String phone,
                        @Param("aadhar") String aadhar,
                        @Param("pan") String pan,
                        @Param("remitterCode") String remitterCode);

        // boolean existsByPanNumber(String panNumber);

        // // ── Status filters ───────────────────────────────────────────────────────

        // Page<Remitter> findByStatus(Boolean status, Pageable pageable);

        // List<Remitter> findByStatus(Boolean status);

        // long countByStatus(Boolean status);

        // // ── Search ───────────────────────────────────────────────────────────────

        // // @Query("SELECT r FROM Remitter r WHERE " +
        // // "LOWER(r.organizationName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
        // // "r.gstNumber LIKE CONCAT('%', :query, '%') OR " +
        // // "r.panNumber LIKE CONCAT('%', :query, '%')")
        // // Page<Remitter> searchRemitters(@Param("query") String query, Pageable
        // // pageable);

        // // ── Dashboard stats ──────────────────────────────────────────────────────

        // @Query("SELECT COUNT(r) FROM Remitter r WHERE r.status = 'ACTIVE'")
        // long countActive();

        // @Query("SELECT COUNT(r) FROM Remitter r WHERE r.status = 'PENDING'")
        // long countPending();
}
