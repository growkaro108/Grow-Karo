package com.growkaro.backend.repository;

import com.growkaro.backend.entity.Recipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipientRepository extends JpaRepository<Recipient, String> {

    // ── Lookup by remitter ────────────────────────────────────────────────────

    List<Recipient> findByRemitterId(String remitterId);

    Page<Recipient> findByRemitterId(String remitterId, Pageable pageable);

    Page<Recipient> findByRemitterIdAndActive(String remitterId, boolean active, Pageable pageable);

    Optional<Recipient> findByIdAndRemitterId(String id, String remitterId);

    boolean existsByRemitterIdAndUserId(String remitterId, String userId);

    boolean existsByRemitterIdAndAccountNumber(String remitterId, String accountNumber);

    boolean existsByRemitterIdAndUpiId(String remitterId, String upiId);

    @Query("SELECT r FROM Recipient r WHERE r.remitter.id = :remitterId AND (" +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "r.accountNumber LIKE CONCAT('%', :query, '%') OR " +
           "r.upiId LIKE CONCAT('%', :query, '%'))")
    Page<Recipient> searchByRemitter(@Param("remitterId") String remitterId,
                                     @Param("query") String query,
                                     Pageable pageable);

    long countByRemitterId(String remitterId);

    long countByRemitterIdAndActive(String remitterId, boolean active);

    // ── Lookup by recipient user (across remitters) ─────────────────────────

    List<Recipient> findByUserId(String userId);

    Page<Recipient> findByUserId(String userId, Pageable pageable);

    Page<Recipient> findByUserIdAndActive(String userId, boolean active, Pageable pageable);

    Optional<Recipient> findByIdAndUserId(String id, String userId);

    @Query("SELECT r FROM Recipient r WHERE r.user.id = :userId AND (" +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "r.accountNumber LIKE CONCAT('%', :query, '%') OR " +
           "r.upiId LIKE CONCAT('%', :query, '%'))")
    Page<Recipient> searchByUser(@Param("userId") String userId,
                                 @Param("query") String query,
                                 Pageable pageable);

    long countByUserId(String userId);

    long countByUserIdAndActive(String userId, boolean active);
}
