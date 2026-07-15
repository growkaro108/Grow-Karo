package com.growkaro.backend.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;

public interface UserPortfolio {
    // from scheme table
    @Value("#{target.scheme.schemeId}")
    String getSchemeId();

    @Value("#{target.scheme.schemeName}")
    String getSchemeName();

    @Value("#{target.scheme.investmentAmount}")
    BigDecimal getInvestmentAmount();

    @Value("#{target.scheme.tenure}")
    Integer getTenure();

    @Value("#{target.scheme.payoutFrequency}")
    String getPayoutFrequency();

    @Value("#{target.scheme.profitPercentage}")
    Double getProfitPercentage();

    @Value("#{target.scheme.maturityValue}")
    BigDecimal getMaturityValue();

    LocalDateTime getEnrollmentDate();

    // from userscheme table
    List<String> getBondImageURL();

    String getBondNumber();

    LocalDate getRequestDate();

    String getUserSchemeId();

    Double getPaidAmount();

    Boolean getIsApproved();
}