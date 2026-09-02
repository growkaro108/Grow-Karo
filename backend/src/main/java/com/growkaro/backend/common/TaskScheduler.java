package com.growkaro.backend.common;

import java.time.LocalDate;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.growkaro.backend.common.UserSchemePayoutProcessor.BatchOutcome;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.repository.UserSchemeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskScheduler {

    public final String timeZone = "Asia/Kolkata";
    private final UserSchemeRepository userSchemeRepository;
    private final UserSchemePayoutProcessor payoutProcessor;
    private final General general;

    @Scheduled(cron = "0 0 3 * * *", zone = timeZone)
    @SchedulerLock(name = "DailyProfitJob", lockAtMostFor = "5m", lockAtLeastFor = "3m")
    public void addProfitToUserAccount() {
        List<UserScheme> allApprovedUserSchemes = userSchemeRepository
                .findAllApprovedUserSchemes(general.getCurrentDate());

        int processed = 0;
        int skipped = 0;
        int failed = 0;

        for (UserScheme userScheme : allApprovedUserSchemes) {
            try {
                BatchOutcome outcome = payoutProcessor.processSingleUserScheme(userScheme.getUserSchemeId());
                if (outcome == BatchOutcome.PROCESSED) {
                    processed++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                failed++;
                log.error("Failed to add profit for userScheme id={}: {}",
                        userScheme.getUserSchemeId(), e.getMessage(), e);
            }
        }

        log.info("Daily profit payout complete. processed={}, skipped={}, failed={}, total={}",
                processed, skipped, failed, allApprovedUserSchemes.size());
    }

    @Scheduled(cron = "0 15 3 * * *", zone = timeZone)
    @SchedulerLock(name = "notifyForSchemeMatured", lockAtMostFor = "5m", lockAtLeastFor = "2m")
    public void notifyForSchemeMatured() {
        LocalDate today = general.getCurrentDate();
        List<UserScheme> allApprovedUserSchemes = userSchemeRepository
                .findAllByMaturityDate(today, today.plusDays(15));

        int notified = 0;
        int skipped = 0;
        int failed = 0;

        for (UserScheme userScheme : allApprovedUserSchemes) {
            try {
                BatchOutcome outcome = payoutProcessor.notifySingleUserScheme(userScheme.getUserSchemeId());
                if (outcome == BatchOutcome.PROCESSED) {
                    notified++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                failed++;
                log.error("Failed to send maturity notification for userScheme id={}: {}",
                        userScheme.getUserSchemeId(), e.getMessage(), e);
            }
        }

        log.info("Maturity notification run complete. notified={}, skipped={}, failed={}, total={}",
                notified, skipped, failed, allApprovedUserSchemes.size());
    }

}