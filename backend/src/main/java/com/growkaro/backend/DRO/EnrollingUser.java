package com.growkaro.backend.DRO;

import java.math.BigDecimal;

public record EnrollingUser(
                String schemeId,
                String userId,
                BigDecimal amount, String nomineeId) {

}
