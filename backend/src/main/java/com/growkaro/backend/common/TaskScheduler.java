package com.growkaro.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.DRO.MaturedUserSchemeIds;
import com.growkaro.backend.common.UserSchemePayoutProcessor.BatchOutcome;
import com.growkaro.backend.common.UserSchemePayoutProcessor.ReinvestResult;
import com.growkaro.backend.entity.Nominee;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.entity.User.Role;
import com.growkaro.backend.enums.UserSchemeStatus;
import com.growkaro.backend.repository.UserRepository;
import com.growkaro.backend.repository.UserSchemeRepository;
import com.growkaro.backend.security.AdminPolicy;
import com.growkaro.backend.service.ActivityLogService;
import com.growkaro.backend.service.CrucialNotificationService;
import com.growkaro.backend.service.RedisService;
import com.growkaro.backend.service.UserAPIService;

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
    private final RedisService redisService;
    private final CrucialNotificationService crucialNotificationService;
    private final AdminPolicy adminPolicy;
    private final UserRepository userRepository;

    // CRON EXPLANATION
    // 1. Minute 0
    // 2. Hour 3
    // 3. Day of Month Any
    // 4. Month Any
    // 5. Day of Week Any
    // 6. Timezone Asia/Kolkata
    // 7. Run every day at 3:00:00 AM (Kolkata time)

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
                BatchOutcome outcome = payoutProcessor.processSingleUserScheme(userScheme);
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
                BatchOutcome outcome = payoutProcessor.notifySingleUserScheme(userScheme);
                if (outcome == BatchOutcome.PROCESSED) {
                    notified++;
                } else {
                    skipped++;
                }

                // remove admin name
                boolean status = redisService.delete("malik");
                log.info("Admin name delete from redis: {}", status);

            } catch (Exception e) {
                failed++;
                log.error("Failed to send maturity notification for userScheme id={}: {}",
                        userScheme.getUserSchemeId(), e.getMessage(), e);
            }
        }

        log.info("Maturity notification run complete. notified={}, skipped={}, failed={}, total={}",
                notified, skipped, failed, allApprovedUserSchemes.size());
    }

    // Runs every day at midnight (00:00:00)
    @Scheduled(cron = "0 0 0 * * ?", zone = timeZone)
    @Transactional
    public void setMaturity() {
        try {
            LocalDate today = general.getCurrentDate();
            List<UserScheme> allApprovedUserSchemes = userSchemeRepository
                    .findAllByMaturityDate(today, today);

            for (UserScheme userScheme : allApprovedUserSchemes) {
                BigDecimal totalProfit = userScheme.getProfitLedger().stream().map(a -> a.getProfitAmount())
                        .reduce((a, b) -> a.add(b)).orElse(BigDecimal.ZERO);
                BigDecimal totalReedem = userScheme.getReedemLedger().stream().map(a -> a.getRedeemAmount())
                        .reduce((a, b) -> a.add(b)).orElse(BigDecimal.ZERO);
                BigDecimal netProfit = userScheme.getPaidAmount().add(totalProfit.subtract(totalReedem));
                if (userScheme.getStatus() != UserSchemeStatus.MATURED) {
                    // Uncomment these when ready to save
                    userScheme.setStatus(UserSchemeStatus.MATURED);
                    userSchemeRepository.save(userScheme);
                    try {
                        String title = "Scheme Maturity Alert";
                        String message = String.format(
                                "Your investment in '%s' has matured today.\n\n" +
                                        "• Maturity Returns: ₹%s\n" +
                                        "• Status: Ready for withdrawal or reinvestment\n\n" +
                                        "Visit your dashboard to view complete return details.",
                                userScheme.getScheme().getSchemeName(),
                                netProfit.toString());

                        crucialNotificationService.sendUserNotificationWithCustomMessage(
                                title,
                                message,
                                userScheme.getUser().getId(),
                                "/dashboard",
                                null);
                    } catch (Exception e) {
                        log.error("Failed to send maturity notification for userScheme id={}: {}",
                                userScheme.getUserSchemeId(), e.getMessage(), e);
                    }
                    log.info("Maturity date set for userScheme id={}", userScheme.getUserSchemeId());
                }
            }
        } catch (Exception e) {
            log.error("Failed to execute maturity scheduler: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 30 3 * * *", zone = timeZone)
    @SchedulerLock(name = "reinvestMaturedUserScheme", lockAtMostFor = "5m", lockAtLeastFor = "3m")
    @Transactional
    public void reinvestMaturedUserScheme() {
        LocalDate today = general.getCurrentDate();

        List<UserScheme> allApprovedUserSchemes;
        try {
            allApprovedUserSchemes = userSchemeRepository
                    .findAllByMaturityDatePassedAndNotReInvestedYet(today);
        } catch (Exception e) {
            log.error("Failed to fetch matured userSchemes: {}", e.getMessage());
            return;
        }

        String adminId = general.adminId(); // hoisted out of the loop

        for (UserScheme us : allApprovedUserSchemes) {
            String userSchemeId = us.getUserSchemeId();
            try {
                ReinvestResult result = payoutProcessor.reinvestSingle(us, today);

                log.info("Matured userScheme id={} reinvested successfully into id={}",
                        userSchemeId, result.newUserSchemeId());

                payoutProcessor.notifyUser(result, today);
                payoutProcessor.notifyAdmin(result, today, adminId);

            } catch (Exception e) {
                log.error("Failed to auto reinvest userScheme id={}: {}", userSchemeId, e.getMessage());
                // continue to next item
            }
        }
    }

    // // run on every 6 hours
    // @Scheduled(cron = "0 0 */6 * * *", zone = timeZone)
    // public void updateRole(){
    // log.info("Updating role for admin users");
    // Set<String> adminEmails = adminPolicy.adminEmails;

    // if (adminEmails == null || adminEmails.isEmpty()) {
    // log.warn("Admin emails set is empty, skipping role update");
    // return;
    // }

    // List<User> users = userRepository.findAllByEmailIn(adminEmails);
    // for (User user : users) {
    // if(!user.getRole().equals(Role.ADMIN)){
    // user.setRole(Role.ADMIN);
    // userRepository.save(user);
    // log.info("Updated role for user: {}", user.getEmail());
    // }
    // }
    // }

}