package com.growkaro.backend.DTO;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.util.List;

import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    // userScheme
    String userSchemeId;
    UserSchemeStatus status;
    Long paidAmount;
    List<LocalDate> paymentDates;
    Boolean isApproved;
    LocalDate requestDate;
    // scheme
    String schemeName;
    BigDecimal investmentAmount;
    // user
    String name;
    String email;
    String phone;

}
