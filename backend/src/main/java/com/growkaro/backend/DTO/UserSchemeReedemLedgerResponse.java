package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.growkaro.backend.entity.UserSchemeReedemLedger;
import com.growkaro.backend.entity.UserSchemeReedemLedger.RedeemType;
import com.growkaro.backend.entity.UserSchemeReedemLedger.ReedeemStatus;

public record UserSchemeReedemLedgerResponse(
                Long id,
                BigDecimal redeemAmount,
                LocalDate redeemDate,
                ReedeemStatus status,
                RedeemType redeemType) {

        public static UserSchemeReedemLedgerResponse fromEntity(
                        UserSchemeReedemLedger ledger) {
                return new UserSchemeReedemLedgerResponse(
                                ledger.getId(),
                                ledger.getRedeemAmount(),
                                ledger.getRedeemDate(),
                                ledger.getStatus(),
                                ledger.getRedeemType()
                );
        }
}