package com.growkaro.backend.DRO;

import java.util.List;

public record UserSchemeLedgerUpdateRequest(
        List<UserSchemeProfitLedgerRequest> profitLedger,
        List<UserSchemeReedemLedgerRequest> reedemLedger) {
}