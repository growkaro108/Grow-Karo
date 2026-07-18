package com.growkaro.backend.repository;

import com.growkaro.backend.entity.FundraiserCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FundraiserCodeRepository extends JpaRepository<FundraiserCode, String> {

       // ── Lookup ───────────────────────────────────────────────────────────────

       Optional<FundraiserCode> findByCode(String code);

       Optional<FundraiserCode> findByCodeAndActive(String code, boolean active);

       // ── Per-remitter queries ─────────────────────────────────────────────────

       Page<FundraiserCode> findByRemitterId(String remitterId, Pageable pageable);

       List<FundraiserCode> findByRemitterIdAndActive(String remitterId, boolean active);

       // ── Existence checks ─────────────────────────────────────────────────────

       boolean existsByCode(String code);

       // ── Active & non-expired codes ────────────────────────────────────────────

       @Query("SELECT fc FROM FundraiserCode fc WHERE fc.active = true AND " +
                     "(fc.expiresAt IS NULL OR fc.expiresAt > :now) AND " +
                     "fc.usageCount < fc.usageLimit")
       List<FundraiserCode> findAllValidCodes(@Param("now") LocalDateTime now);

       @Query("SELECT fc FROM FundraiserCode fc WHERE fc.remitter.id = :remitterId AND fc.active = true AND " +
                     "(fc.expiresAt IS NULL OR fc.expiresAt > :now) AND " +
                     "fc.usageCount < fc.usageLimit")
       List<FundraiserCode> findValidCodesByRemitter(@Param("remitterId") String remitterId,
                     @Param("now") LocalDateTime now);

       // ── Stats ─────────────────────────────────────────────────────────────────

       long countByRemitterId(String remitterId);

       long countByRemitterIdAndActive(String remitterId, boolean active);

       @Query("SELECT COALESCE(SUM(fc.usageCount), 0) FROM FundraiserCode fc WHERE fc.remitter.id = :remitterId")
       long sumUsageCountByRemitter(@Param("remitterId") String remitterId);
}
