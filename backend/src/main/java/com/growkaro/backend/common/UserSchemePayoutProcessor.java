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

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserSchemePayoutProcessor {

    private final UserSchemeRepository userSchemeRepository;
    private final ProfitLedgerRepository profitLedgerRepository;
    private final EmailService emailService;
    private final General general;
    private final CrucialNotificationService crucialNotificationService;
    private final String adminEmail;

    public UserSchemePayoutProcessor(UserSchemeRepository userSchemeRepository,
            ProfitLedgerRepository profitLedgerRepository, EmailService emailService, General general,
            CrucialNotificationService crucialNotificationService, @Value("${admin.email}") String adminEmail) {
        this.userSchemeRepository = userSchemeRepository;
        this.profitLedgerRepository = profitLedgerRepository;
        this.emailService = emailService;
        this.general = general;
        this.crucialNotificationService = crucialNotificationService;
        this.adminEmail = adminEmail;
    }

    public enum BatchOutcome {
        PROCESSED, SKIPPED
    }

    private BatchOutcome skip(UserScheme userScheme, String reason) {
        log.info("SKIPPED userScheme id={} | reason={}",
                userScheme != null ? userScheme.getUserSchemeId() : null, reason);
        return BatchOutcome.SKIPPED;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BatchOutcome processSingleUserScheme(UserScheme userScheme) {

        if (userScheme.getScheme() == null) {
            return skip(userScheme, "no scheme attached");
        }

        if ("PENSION".equalsIgnoreCase(userScheme.getScheme().getPlanType())) {
            return skip(userScheme, "pension plan type");
        }

        LocalDate today = general.getCurrentDate();

        if (userScheme.getLastProfitUpdateDate() != null
                && userScheme.getLastProfitUpdateDate().isEqual(today)) {
            return skip(userScheme, "profit already processed today (lastProfitUpdateDate=" + today + ")");
        }

        if (profitLedgerRepository.existsByUserSchemeAndProfitDate(userScheme, today)) {
            return skip(userScheme, "profit ledger entry already exists for " + today);
        }

        BigDecimal paidAmount = userScheme.getPaidAmount();
        Double profitPercentage = userScheme.getScheme().getProfitPercentage();
        BigDecimal minimumAmount = userScheme.getScheme().getMinimumAmount();
        LocalDate nextPayoutDate = userScheme.getNextPayoutDate();

        if (paidAmount == null || profitPercentage == null || minimumAmount == null
                || nextPayoutDate == null) {
            // This is a failure, not a skip: it throws, so log it as such
            log.error("FAILED userScheme id={} | reason=missing required fields "
                    + "(paidAmount={}, profitPercentage={}, minimumAmount={}, nextPayoutDate={})",
                    userScheme.getUserSchemeId(), paidAmount, profitPercentage, minimumAmount, nextPayoutDate);
            throw new IllegalStateException(
                    "UserScheme id=" + userScheme.getUserSchemeId()
                            + " missing required field(s) for profit calculation");
        }

        BigDecimal newProfit = general.calculateProfit(paidAmount, profitPercentage, minimumAmount);

        if (newProfit == null || newProfit.signum() < 0) {
            log.error("FAILED userScheme id={} | reason=invalid profit calculation: {}",
                    userScheme.getUserSchemeId(), newProfit);
            throw new IllegalStateException(
                    "UserScheme id=" + userScheme.getUserSchemeId() + " computed invalid profit: " + newProfit);
        }

        Scheme s = userScheme.getScheme();
        int days = general.resolvePeriodDays(userScheme.getEnrollmentDate(), s.getPayoutFrequency(), s.getTenure());

        UserSchemeProfitLedger ledgerEntry = new UserSchemeProfitLedger();
        ledgerEntry.setUserScheme(userScheme);
        ledgerEntry.setProfitAmount(newProfit);
        ledgerEntry.setProfitDate(today);

        try {
            profitLedgerRepository.saveAndFlush(ledgerEntry);
            log.info("Saved profit ledger entry for userScheme id={} with profit amount={}",
                    userScheme.getUserSchemeId(), newProfit);
        } catch (DataIntegrityViolationException e) {
            return skip(userScheme, "duplicate ledger entry prevented by DB constraint for " + today);
        }

        try {
            userScheme.setLastProfitUpdateDate(today);
            //compare with maturity date and update next payout date accordingly
            if (userScheme.getMaturityDate() != null && nextPayoutDate.plusDays(days).isAfter(userScheme.getMaturityDate())) {
                userScheme.setNextPayoutDate(userScheme.getMaturityDate());
            } else {
                userScheme.setNextPayoutDate(nextPayoutDate.plusDays(days));
            }
            userSchemeRepository.saveAndFlush(userScheme);
        } catch (DataIntegrityViolationException e) {
            log.error("FAILED userScheme id={} | reason=failed to update next payout date: {}",
                    userScheme.getUserSchemeId(), e.getMessage(), e);
            throw new IllegalStateException(
                    "UserScheme id=" + userScheme.getUserSchemeId() + " failed to update next payout date", e);
        }
        log.info("Updated userScheme id={} with next payout date={}", userScheme.getUserSchemeId(),
                userScheme.getNextPayoutDate());
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
        crucialNotificationService.sendSchemeMaturityNotification(userScheme);

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

        us.setStatus(UserSchemeStatus.REINVESTED);
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