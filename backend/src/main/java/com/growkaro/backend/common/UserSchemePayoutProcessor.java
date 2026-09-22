package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;
import com.growkaro.backend.repository.ProfitLedgerRepository;
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
    private final ProfitLedgerRepository profitLedgerRepository;
    private final EmailService emailService;
    private final CrucialNotificationService notificationService;
    private final General general;

    @Value("${admin.email}")
    private String adminEmail;

    public enum BatchOutcome {
        PROCESSED, SKIPPED
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BatchOutcome processSingleUserScheme(UserScheme userScheme) {

        if (userScheme.getScheme() == null) {
            log.warn("Skipping userScheme id={}: no scheme attached", userScheme.getUserSchemeId());
            return BatchOutcome.SKIPPED;
        }

        LocalDate today = general.getCurrentDate();

        // Cheap early-exit (avoids the calculation work entirely on a normal re-run)
        if (userScheme.getLastProfitUpdateDate() != null
                && userScheme.getLastProfitUpdateDate().isEqual(today)) {
            return BatchOutcome.SKIPPED;
        }

        // Hard guard: DB is the source of truth for "already paid today",
        // protects against races / lock expiry / manual re-trigger
        if (profitLedgerRepository.existsByUserSchemeAndProfitDate(userScheme, today)) {
            return BatchOutcome.SKIPPED;
        }

        BigDecimal paidAmount = userScheme.getPaidAmount();
        Double profitPercentage = userScheme.getScheme().getProfitPercentage();
        BigDecimal minimumAmount = userScheme.getScheme().getMinimumAmount();
        LocalDate nextPayoutDate = userScheme.getNextPayoutDate();

        if (paidAmount == null || profitPercentage == null || minimumAmount == null
                || nextPayoutDate == null) {
            throw new IllegalStateException(
                    "UserScheme id=" + userScheme.getUserSchemeId()
                            + " missing required field(s) for profit calculation");
        }

        BigDecimal newProfit = general.calculateProfit(paidAmount, profitPercentage, minimumAmount);

        if (newProfit == null || newProfit.signum() < 0) {
            throw new IllegalStateException(
                    "UserScheme id=" + userScheme.getUserSchemeId() + " computed invalid profit: " + newProfit);
        }

        Scheme s=userScheme.getScheme();
        int days = general.resolvePeriodDays(s.getPayoutFrequency(),s.getTenure());

        UserSchemeProfitLedger ledgerEntry = new UserSchemeProfitLedger();
        ledgerEntry.setUserScheme(userScheme);
        ledgerEntry.setProfitAmount(newProfit);
        ledgerEntry.setProfitDate(today);

        try {
            profitLedgerRepository.save(ledgerEntry);
        } catch (DataIntegrityViolationException e) {
            // Another thread/instance beat us to today's entry for this userScheme
            log.warn("Duplicate profit ledger entry prevented for userScheme id={}, date={}",
                    userScheme.getUserSchemeId(), today);
            return BatchOutcome.SKIPPED;
        }

        userScheme.setLastProfitUpdateDate(today);
        userScheme.setNextPayoutDate(nextPayoutDate.plusDays(days));
        userSchemeRepository.save(userScheme);

        return BatchOutcome.PROCESSED;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BatchOutcome notifySingleUserScheme(UserScheme userScheme) {

        if (Boolean.TRUE.equals(userScheme.getMaturityNotificationSent())) {
            return BatchOutcome.SKIPPED;
        }
        if (userScheme.getMaturityDate() == null) {
            log.warn("Skipping userScheme id={}: no maturity date set", userScheme.getUserSchemeId());
            return BatchOutcome.SKIPPED;
        }

        long daysUntilMaturity = userScheme.getMaturityDate().toEpochDay()
                - general.getCurrentDate().toEpochDay();

        emailService.sendSchemeMaturityEmailtoUser(userScheme);
        emailService.sendSchemeMaturityEmailtoAdmin(userScheme, adminEmail);
        notificationService.sendSchemeMaturityNotification(userScheme);

        userScheme.setMaturityNotificationSent(true);
        userSchemeRepository.save(userScheme);

        log.info("Scheme maturing in {} days, notification sent: {}", daysUntilMaturity, userScheme.getUserSchemeId());
        return BatchOutcome.PROCESSED;
    }
}