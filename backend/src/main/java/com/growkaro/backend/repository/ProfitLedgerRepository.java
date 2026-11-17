package com.growkaro.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.growkaro.backend.DTO.PensionProfitDueResponse;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;

import jakarta.persistence.LockModeType;

public interface ProfitLedgerRepository extends JpaRepository<UserSchemeProfitLedger, Long> {

        boolean existsByUserSchemeAndProfitDate(UserScheme userScheme, LocalDate profitDate);

        @Query("SELECT COALESCE(SUM(p.profitAmount), 0) FROM UserSchemeProfitLedger p WHERE p.userScheme = :userScheme")
        BigDecimal sumProfitByUserScheme(@Param("userScheme") UserScheme userScheme);

        @Query(value = """
                        SELECT new com.growkaro.backend.DTO.PensionProfitDueResponse(
                            p.id, us.userSchemeId, u.name, u.email, s.schemeName, us.bondNumber,
                            p.profitDate, p.profitAmount)
                        FROM UserSchemeProfitLedger p
                        JOIN p.userScheme us
                        JOIN us.user u
                        JOIN us.scheme s
                        WHERE p.paid = false
                            AND p.profitDate >= :dueThroughDate
                            AND p.profitDate <= :toDate
                            AND (
                                LOWER(s.planType) = 'pension'
                                OR (LOWER(s.planType) = 'fd' AND p.profitDate <> us.maturityDate)
                            )
                            AND (:query = ''
                                OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(s.schemeName) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(us.bondNumber) LIKE LOWER(CONCAT('%', :query, '%')))
                        ORDER BY p.profitDate ASC, u.name ASC
                        """, countQuery = """
                        SELECT COUNT(p)
                        FROM UserSchemeProfitLedger p
                        JOIN p.userScheme us
                        JOIN us.user u
                        JOIN us.scheme s
                        WHERE p.paid = false
                            AND p.profitDate >= :dueThroughDate
                            AND p.profitDate <= :toDate
                            AND (
                                LOWER(s.planType) = 'pension'
                                OR (LOWER(s.planType) = 'fd' AND p.profitDate <> us.maturityDate)
                            )
                            AND (:query = ''
                                OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(s.schemeName) LIKE LOWER(CONCAT('%', :query, '%'))
                                OR LOWER(us.bondNumber) LIKE LOWER(CONCAT('%', :query, '%')))
                        """)
        Page<PensionProfitDueResponse> findDuePensionProfits(
                        @Param("dueThroughDate") LocalDate dueThroughDate,
                        @Param("toDate") LocalDate toDate,
                        @Param("query") String query,
                        Pageable pageable);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                        SELECT p
                        FROM UserSchemeProfitLedger p
                        JOIN FETCH p.userScheme us
                        JOIN FETCH us.scheme
                        WHERE p.id = :id
                        """)
        Optional<UserSchemeProfitLedger> findByIdForUpdate(@Param("id") Long id);
}