package com.growkaro.backend.DRO;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ApproveUserScheme(String userId,String userSchemeId, BigDecimal paidAmount, LocalDate paidDate) {

}
