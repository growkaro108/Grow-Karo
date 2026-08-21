package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.repository.UserSchemeRepository;
import com.growkaro.backend.service.CrucialNotificationService;
import com.growkaro.backend.service.EmailService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskScheduler {

    public final String timeZone = "Asia/Kolkata";
    private final UserSchemeRepository userSchemeRepository;
    private final EmailService emailService;
    private final CrucialNotificationService notificationService;
    private final General general;

    @Value("${admin.email}")
    private String adminEmail;

    // Cron expression for 04:00 AM every day
    @Scheduled(cron = "0 0 3 * * *", zone = timeZone)
    @SchedulerLock(name = "DailyProfitJob", lockAtMostFor = "5m", lockAtLeastFor = "2m") // lock the db to prevent from
                                                                                         // running multiple times
    @Transactional
    public void addProfitToUserAccount() {
        List<UserScheme> allApprovedUserSchemes = userSchemeRepository
                .findAllApprovedUserSchemes(general.getCurrentDate());
        int processed = 0;
        int failed = 0;

        for (UserScheme userScheme : allApprovedUserSchemes) {
            try {

                if (userScheme.getScheme() == null) {
                    log.warn("Skipping userScheme id={}: no scheme attached", userScheme.getUserSchemeId());
                    failed++;
                    continue;
                }
                if (userScheme.getLastProfitUpdateDate() != null
                        && userScheme.getLastProfitUpdateDate().isEqual(general.getCurrentDate())) {
                    continue;
                }

                BigDecimal newProfit = general.calculateProfit(
                        userScheme.getPaidAmount(),
                        userScheme.getScheme().getProfitPercentage(),
                        userScheme.getScheme().getMinimumAmount());

                userScheme.setProfit(userScheme.getProfit().add(newProfit));
                userScheme.setLastProfitUpdateDate(general.getCurrentDate());
                int days = general.resolvePeriodDays(userScheme.getScheme().getPayoutFrequency());
                userScheme.setNextPayoutDate(userScheme.getNextPayoutDate().plusDays(days));

                userSchemeRepository.save(userScheme);
                processed++;

            } catch (Exception e) {
                // isolate the failure to this one record so the rest of the batch still runs
                failed++;
                log.error("Failed to add profit for userScheme id={}: {}", userScheme.getUserSchemeId(), e.getMessage(),
                        e);
            }
        }

        log.info("Daily profit payout complete. processed={}, failed={}, total={}",
                processed, failed, allApprovedUserSchemes.size());
    }

    // cron expression for 4:45 AM every day
    @Scheduled(cron = "0 10 4 * * *", zone = timeZone)
    @SchedulerLock(name = "notifyForSchemeMatured", lockAtMostFor = "5m", lockAtLeastFor = "2m") // lock the db to
                                                                                                 // prevent from running
                                                                                                 // multiple times
    @Transactional
    public void notifyForSchemeMatured() {
        // notify user and admin by email and notification 10-15 days before maturity
        // date
        LocalDate today = general.getCurrentDate();
        List<UserScheme> allApprovedUserSchemes = userSchemeRepository
                .findAllByMaturityDate(today, today.plusDays(15));
        for (UserScheme userScheme : allApprovedUserSchemes) {
            try {
                long daysUntilMaturity = userScheme.getMaturityDate().toEpochDay()
                        - general.getCurrentDate().toEpochDay();

                if (Boolean.TRUE.equals(userScheme.getMaturityNotificationSent())) {
                    continue;
                }

                emailService.sendSchemeMaturityEmailtoUser(userScheme);
                emailService.sendSchemeMaturityEmailtoAdmin(userScheme, adminEmail);
                notificationService.sendSchemeMaturityNotification(userScheme);

                userScheme.setMaturityNotificationSent(true);
                userSchemeRepository.save(userScheme);

                log.info("Scheme maturing in {} days, notification sent: {}", daysUntilMaturity,
                        userScheme.getUserSchemeId());

            } catch (Exception e) {
                // isolate the failure to this one record so the rest of the batch still runs
                log.error("Failed to send maturity notification for userScheme id={}: {}", userScheme.getUserSchemeId(),
                        e.getMessage(), e);
            }
        }
    }
}