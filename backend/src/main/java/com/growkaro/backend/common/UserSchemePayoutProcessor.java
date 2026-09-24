package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.entity.Nominee;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.UserSchemeProfitLedger;
import com.growkaro.backend.enums.UserSchemeStatus;
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
    private final CrucialNotificationService crucialNotificationService;

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

        Scheme s = userScheme.getScheme();
        int days = general.resolvePeriodDays(s.getPayoutFrequency(), s.getTenure());

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

    public ReinvestResult reinvestSingle(UserScheme us, LocalDate today) {
        User u = us.getUser();
        Scheme s = us.getScheme();
        Nominee n = us.getNominee();

        BigDecimal totalAmount = general.countProfit(us.getProfitLedger())
                .subtract(general.countReedem(us.getReedemLedger()))
                .add(us.getPaidAmount())
                .setScale(2, RoundingMode.HALF_UP);

        if (totalAmount.compareTo(s.getMinimumAmount()) < 0 || totalAmount.compareTo(s.getMaximumAmount()) > 0) {
            throw new IllegalStateException(String.format(
                    "Reinvestment amount %s for userScheme id=%s is outside scheme %s's allowed range [%s, %s]",
                    totalAmount, us.getUserSchemeId(), s.getSchemeName(), s.getMinimumAmount(), s.getMaximumAmount()));
        }

        UserScheme newUserScheme = new UserScheme();
        newUserScheme.setPaidAmount(totalAmount);
        newUserScheme.setPaidDate(today);
        newUserScheme.setRequestDate(general.getCurrentDateTime());
        newUserScheme.setUser(u);
        newUserScheme.setNominee(n);
        newUserScheme.setScheme(s);
        newUserScheme.setStatus(UserSchemeStatus.ACTIVE);

        s.enrollUserInScheme(newUserScheme);
        u.enrollInScheme(newUserScheme);

        newUserScheme = userSchemeRepository.save(newUserScheme);

        us.setReinvestedIntoUserSchemeId(newUserScheme.getUserSchemeId());
        userSchemeRepository.save(us);

        return new ReinvestResult(
                us.getUserSchemeId(),
                newUserScheme.getUserSchemeId(),
                u.getId(),
                u.getName(),
                u.getEmail(),
                s.getSchemeName(),
                totalAmount);
    }

    public void notifyUser(ReinvestResult r, LocalDate today) {
        try {
            String title = "Scheme Auto-Reinvested";
            String message = String.format(
                    "Your mature investment of ₹%s has been successfully reinvested into %s on %s.\n\n" +
                            "View your updated portfolio details in the dashboard.",
                    r.totalAmount(), r.schemeName(), today.format(general.DATE_FORMATTER));

            crucialNotificationService.sendUserNotificationWithCustomMessage(
                    title, message, r.userId(), "/dashboard", null);
        } catch (Exception e) {
            log.error("Failed to send maturity notification for userScheme id={}: {}",
                    r.oldUserSchemeId(), e.getMessage(), e);
        }
    }

    public void notifyAdmin(ReinvestResult r, LocalDate today, String adminId) {
        try {
            String adminTitle = "Auto-Reinvestment Executed";
            String adminMessage = String.format(
                    "Automated reinvestment processed for User : %s (%s).\n\n" +
                            "• Scheme: %s\n" +
                            "• Amount: ₹%s\n" +
                            "• Date: %s\n\n" +
                            "Add Bond into this user account to activate investment.",
                    r.userName(), r.userEmail(), r.schemeName(), r.totalAmount(),
                    today.format(general.DATE_FORMATTER));

            crucialNotificationService.sendAdminNotificationWithCustomMessage(
                    adminTitle, adminMessage, adminId, "/dashboard", null);
        } catch (Exception e) {
            log.error("Failed to send admin maturity notification for userScheme id={}: {}",
                    r.oldUserSchemeId(), e.getMessage(), e);
        }
    }

    public record ReinvestResult(
            String oldUserSchemeId,
            String newUserSchemeId,
            String userId,
            String userName,
            String userEmail,
            String schemeName,
            BigDecimal totalAmount) {
    }

}