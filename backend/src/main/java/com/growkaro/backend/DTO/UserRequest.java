package com.growkaro.backend.DTO;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.util.List;

import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;
import java.math.BigDecimal;

public interface UserRequest {
    String getUserSchemeId();

    UserSchemeStatus getStatus();

    Long getPaidAmount();

    List<LocalDate> getPaymentDates();

    Boolean getIsApproved();

    LocalDate getRequestDate();

    @JsonIgnore
    SchemeProjection getScheme();

    @JsonIgnore
    UserProjection getUser();

    interface SchemeProjection {
        String getSchemeName();

        BigDecimal getInvestmentAmount();
    }

    interface UserProjection {
        String getEmail();

        String getPhone();

        String getName();
    }

    default String getSchemeName() {
        return getScheme() != null ? getScheme().getSchemeName() : null;
    }

    default BigDecimal getInvestmentAmount() {
        return getScheme() != null ? getScheme().getInvestmentAmount() : null;
    }

    default String getEmail() {
        return getUser() != null ? getUser().getEmail() : null;
    }

    default String getPhone() {
        return getUser() != null ? getUser().getPhone() : null;
    }

    default String getName() {
        return getUser() != null ? getUser().getName() : null;
    }
}
