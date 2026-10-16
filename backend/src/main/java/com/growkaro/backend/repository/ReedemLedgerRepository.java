package com.growkaro.backend.repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger.ReedeemStatus;

public interface ReedemLedgerRepository extends JpaRepository<UserSchemeReedemLedger, Long> {

    Optional<UserSchemeReedemLedger> findByUserSchemeAndRedeemAmount(UserScheme us, BigDecimal amount);

    Optional<UserSchemeReedemLedger> findFirstByUserSchemeAndRedeemAmountAndStatusInOrderByIdDesc(
            UserScheme us, BigDecimal amount, List<ReedeemStatus> statuses);
}
