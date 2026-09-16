package com.growkaro.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;

public interface ProfitLedgerRepository extends JpaRepository<UserSchemeProfitLedger, Long> {

    boolean existsByUserSchemeAndProfitDate(UserScheme userScheme, LocalDate profitDate);

    @Query("SELECT COALESCE(SUM(p.profitAmount), 0) FROM UserSchemeProfitLedger p WHERE p.userScheme = :userScheme")
    BigDecimal sumProfitByUserScheme(@Param("userScheme") UserScheme userScheme);
}