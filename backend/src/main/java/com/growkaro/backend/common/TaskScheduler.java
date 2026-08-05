package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.UserSchemeStatus;
import com.growkaro.backend.repository.UserSchemeRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class TaskScheduler {

    public final String timeZone = "Asia/Kolkata";
    @Autowired
    private UserSchemeRepository userSchemeRepository;
    @Autowired
    private General general;

    // Cron expression for 12:00 AM every day
    @Scheduled(cron = "0 0 0 * * *", zone = timeZone)
    // @SchedulerLock(name = "DailyProfitJob", lockAtMostFor = "30m", lockAtLeastFor
    // = "5m") //for production load balancing adding library⏱️
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

                BigDecimal newProfit = general.calculateProfit(
                        userScheme.getPaidAmount(),
                        userScheme.getScheme().getProfitPercentage(),
                        userScheme.getScheme().getMinimumAmount());

                userScheme.setProfit(userScheme.getProfit().add(newProfit));
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

}