package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.repository.UserSchemeRepository;
import com.growkaro.backend.service.CrucialNotificationService;
import com.growkaro.backend.service.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSchemePayoutProcessor {

    private final UserSchemeRepository userSchemeRepository;
    private final EmailService emailService;
    private final CrucialNotificationService notificationService;
    private final General general;

    @Value("${admin.email}")
    private String adminEmail;

    public enum BatchOutcome {
        PROCESSED, SKIPPED
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BatchOutcome processSingleUserScheme(String userSchemeId) {
        UserScheme userScheme = userSchemeRepository.findByUserSchemeId(userSchemeId)
                .orElseThrow(() -> new IllegalStateException("UserScheme not found: " + userSchemeId));

        if (userScheme.getScheme() == null) {
            log.warn("Skipping userScheme id={}: no scheme attached", userSchemeId);
            return BatchOutcome.SKIPPED;
        }

        if (userScheme.getLastProfitUpdateDate() != null
                && userScheme.getLastProfitUpdateDate().isEqual(general.getCurrentDate())) {
            return BatchOutcome.SKIPPED;
        }

        BigDecimal paidAmount = userScheme.getPaidAmount();
        Double profitPercentage = userScheme.getScheme().getProfitPercentage();
        BigDecimal minimumAmount = userScheme.getScheme().getMinimumAmount();
        BigDecimal currentProfit = userScheme.getProfit();
        LocalDate nextPayoutDate = userScheme.getNextPayoutDate();

        if (paidAmount == null || profitPercentage == null || minimumAmount == null
                || currentProfit == null || nextPayoutDate == null) {
            throw new IllegalStateException(
                    "UserScheme id=" + userSchemeId + " missing required field(s) for profit calculation");
        }

        BigDecimal newProfit = general.calculateProfit(paidAmount, profitPercentage, minimumAmount);

        if (newProfit == null || newProfit.signum() < 0) {
            throw new IllegalStateException(
                    "UserScheme id=" + userSchemeId + " computed invalid profit: " + newProfit);
        }

        int days = general.resolvePeriodDays(userScheme.getScheme().getPayoutFrequency());

        userScheme.setProfit(currentProfit.add(newProfit));
        userScheme.setLastProfitUpdateDate(general.getCurrentDate());
        userScheme.setNextPayoutDate(nextPayoutDate.plusDays(days));

        userSchemeRepository.save(userScheme);
        return BatchOutcome.PROCESSED;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BatchOutcome notifySingleUserScheme(String userSchemeId) {
        UserScheme userScheme = userSchemeRepository.findByUserSchemeId(userSchemeId)
                .orElseThrow(() -> new IllegalStateException("UserScheme not found: " + userSchemeId));

        if (Boolean.TRUE.equals(userScheme.getMaturityNotificationSent())) {
            return BatchOutcome.SKIPPED;
        }
        if (userScheme.getMaturityDate() == null) {
            log.warn("Skipping userScheme id={}: no maturity date set", userSchemeId);
            return BatchOutcome.SKIPPED;
        }

        long daysUntilMaturity = userScheme.getMaturityDate().toEpochDay()
                - general.getCurrentDate().toEpochDay();

        emailService.sendSchemeMaturityEmailtoUser(userScheme);
        emailService.sendSchemeMaturityEmailtoAdmin(userScheme, adminEmail);
        notificationService.sendSchemeMaturityNotification(userScheme);

        userScheme.setMaturityNotificationSent(true);
        userSchemeRepository.save(userScheme);

        log.info("Scheme maturing in {} days, notification sent: {}", daysUntilMaturity, userSchemeId);
        return BatchOutcome.PROCESSED;
    }
}