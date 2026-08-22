package com.growkaro.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.growkaro.backend.DRO.RecipientContact;
import com.growkaro.backend.common.NotificationBroadcaster;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Notification.ReceiverType;
import com.growkaro.backend.entity.NotificationContentBuilder;
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.entity.Remitter;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.ActivityType;
import com.growkaro.backend.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrucialNotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final NotificationContentBuilder contentBuilder;
    private final NotificationBroadcaster notificationBroadcaster;
    private final ActivityLogService activityLogService;

    @Value("${frontend.url}")
    private String frontendUrl;

    /**
     * Fires the full essential action flow:
     * - User gets tailored in-app notification + email + User SSE
     * - All Admins get tailored admin notification + email + Admin SSE
     * - Remitter gets tailored remitter notification + email + Remitter SSE
     * - Activity is logged to the Admin LiveLog SSE stream.
     */
    @Async
    public void notifyAllForEssentialAction(
            EssentialActionType action,
            User user,
            List<User> admins,
            Remitter remitter,
            String actionUrl,
            Map<String, Object> params) {

        log.info("Triggering essential action notification for action: {}", action);

        // 1. User
        if (user != null) {
            notifyUser(action, user, actionUrl, params);
        }

        // 2. Admins
        if (admins != null && !admins.isEmpty()) {
            admins.forEach(admin -> notifyAdmin(action, admin, actionUrl, params));
        }

        // 3. Remitter
        if (remitter != null) {
            notifyRemitter(action, remitter, actionUrl, params);
        }

        // 4. Record Activity Log for Admin LiveLog stream
        try {
            String actorId = user != null ? user.getId() : (remitter != null ? remitter.getRemitterId() : "system");
            String actorName = user != null ? user.getName()
                    : (remitter != null ? remitter.getOrganizationName() : "System");
            String actorRole = user != null ? "user" : (remitter != null ? "remitter" : "system");
            ActivityType actType = toActivityType(action);
            if (actType != null) {
                activityLogService.log(
                        actorId,
                        actorName,
                        actorRole,
                        actType,
                        contentBuilder.buildPlainMessage(action, ReceiverType.Admin, actorName, params),
                        "notification",
                        action.name(),
                        params);
            }
        } catch (Exception e) {
            log.warn("Failed to log activity for action {}: {}", action, e.getMessage());
        }
    }

    /** Overload for compatibility where remitter is represented as User. */
    @Async
    public void notifyEssentialAction(
            EssentialActionType action,
            User user,
            List<User> admins,
            User remitter,
            String actionUrl,
            Map<String, Object> params) {

        if (user != null) {
            notifyUser(action, user, actionUrl, params);
        }

        if (admins != null && !admins.isEmpty()) {
            admins.forEach(admin -> notifyAdmin(action, admin, actionUrl, params));
        }

        if (remitter != null) {
            notifyInternalUser(action, remitter, actionUrl, params);
        }
    }

    /** Overload for when the remitter is an external contact without a User row. */
    @Async
    public void notifyEssentialAction(
            EssentialActionType action,
            User user,
            List<User> admins,
            RecipientContact externalRemitter,
            String actionUrl,
            Map<String, Object> params) {

        if (user != null) {
            notifyUser(action, user, actionUrl, params);
        }

        if (admins != null && !admins.isEmpty()) {
            admins.forEach(admin -> notifyAdmin(action, admin, actionUrl, params));
        }

        if (externalRemitter != null) {
            notifyExternalContact(action, externalRemitter, params);
        }
    }

    /** 1. Notify User individually */
    @Async
    public void notifyUser(EssentialActionType action, User user, String actionUrl, Map<String, Object> params) {
        if (user == null) {
            return;
        }
        dispatchNotification(action, ReceiverType.User, user.getId(), user.getName(), user.getEmail(), actionUrl,
                params);
    }

    /** 2. Notify Admin individually */
    @Transactional
    public void notifyAdmin(EssentialActionType action, User admin, String actionUrl, Map<String, Object> params) {
        if (admin == null) {
            return;
        }
        dispatchNotification(action, ReceiverType.Admin, admin.getId(), admin.getName(), admin.getEmail(), actionUrl,
                params);
    }

    /** 3. Notify Remitter individually */
    @Transactional
    public void notifyRemitter(EssentialActionType action, Remitter remitter, String actionUrl,
            Map<String, Object> params) {
        if (remitter == null) {
            return;
        }
        dispatchNotification(action, ReceiverType.Remitter, remitter.getRemitterId(), remitter.getOrganizationName(),
                remitter.getRemitterEmail(), actionUrl, params);
    }

    /** Legacy helper for single user */
    @Transactional
    public void notifyInternalUser(EssentialActionType action, User user, String actionUrl,
            Map<String, Object> params) {
        notifyUser(action, user, actionUrl, params);
    }

    /** External contact email only */
    public void notifyExternalContact(EssentialActionType action, RecipientContact contact,
            Map<String, Object> params) {
        if (contact == null || contact.getEmail() == null || contact.getEmail().isBlank()) {
            return;
        }
        try {
            String subject = contentBuilder.buildSubject(action, ReceiverType.Remitter);
            String htmlBody = contentBuilder.buildHtmlBody(action, ReceiverType.Remitter, contact.getName(), params);
            emailService.sendHtml(contact.getEmail(), subject, htmlBody);
        } catch (Exception e) {
            log.error("Failed to send external email notification to {}: {}", contact.getEmail(), e.getMessage());
        }
    }

    public void sendSchemeMaturityNotification(UserScheme userScheme) {
        try {
            String actionUrl = frontendUrl + "/dashboard";
            Map<String, Object> params = new HashMap<>();
            params.put("userSchemeId", userScheme.getUserSchemeId());
            params.put("userId", userScheme.getUser().getId());
            params.put("userName", userScheme.getUser().getName());
            params.put("schemeName", userScheme.getScheme().getSchemeName());
            params.put("maturityDate", userScheme.getMaturityDate());
            params.put("schemeCategory", userScheme.getScheme().getSchemeCategory());
            params.put("schemeDetails", userScheme.getScheme().getSchemeDetails());
            params.put("payoutFrequency", userScheme.getScheme().getPayoutFrequency());
            params.put("tenure", userScheme.getScheme().getTenure());
            params.put("startDate", userScheme.getScheme().getStartDate());
            params.put("endDate", userScheme.getScheme().getEndDate());
            params.put("minimumAmount", userScheme.getScheme().getMinimumAmount());
            params.put("status", userScheme.getScheme().getStatus());
            params.put("riskLevel", userScheme.getScheme().getRiskLevel());
            params.put("paidAmount", userScheme.getPaidAmount());
            params.put("profit", userScheme.getProfit());
            params.put("profitReedemed", userScheme.getProfitReedemed());
            params.put("txnId", userScheme.getUserSchemeId());
            params.put("totalAmount",
                    userScheme.getProfit().add(userScheme.getPaidAmount()).subtract(userScheme.getProfitReedemed()));
            params.put("amount",
                    userScheme.getProfit().add(userScheme.getPaidAmount()).subtract(userScheme.getProfitReedemed()));
            notifyUser(EssentialActionType.SCHEME_MATURITY_REMINDER, userScheme.getUser(), actionUrl, params);
            notifyAdmin(EssentialActionType.SCHEME_MATURITY_REMINDER, userScheme.getUser(), actionUrl, params);
        } catch (Exception e) {
            log.error("Failed to send scheme maturity notification to user {}: {}", userScheme.getUser().getId(),
                    e.getMessage());
        }
    }

    @Async
    private void dispatchNotification(
            EssentialActionType action,
            ReceiverType role,
            String receiverId,
            String name,
            String email,
            String actionUrl,
            Map<String, Object> params) {

        try {
            // A. Save to Database
            Notification notification = new Notification();
            notification.setReceiverType(role);
            notification.setReceiverId(receiverId);
            notification.setTitle(contentBuilder.buildSubject(action, role));
            notification.setMessage(contentBuilder.buildPlainMessage(action, role, name, params));
            notification.setNotificationType(contentBuilder.toNotificationType(action));
            notification.setActionType(contentBuilder.toActionType(action));
            notification.setActionUrl(actionUrl);
            notification.setRead(false);

            Notification saved = notificationRepository.save(notification);

            // B. Stream live event via SSE
            notificationBroadcaster.sendToReceiver(role, receiverId, saved);

            // C. Send HTML Email only if action is email-worthy and email address is
            // present
            if (isEmailWorthy(action, role) && email != null && !email.isBlank()) {
                String subject = contentBuilder.buildSubject(action, role);
                String htmlBody = contentBuilder.buildHtmlBody(action, role, name, params);
                emailService.sendHtml(email, subject, htmlBody);
            }
        } catch (Exception e) {
            log.error("Failed to dispatch notification for action {} to {} [ID: {}]: {}", action, role, receiverId,
                    e.getMessage());
        }
    }

    /**
     * Determines which actions justify sending an email vs keeping strictly in-app
     * SSE.
     */
    public boolean isEmailWorthy(EssentialActionType action, ReceiverType role) {
        return switch (action) {
            // High-stakes financial, compliance, and security events receive Email + In-App
            case WITHDRAWAL_APPROVED,
                    WITHDRAWAL_REJECTED,
                    WITHDRAWAL_DISBURSED,
                    FUND_TRANSFER_COMPLETED,
                    PAYMENT_FAILED,
                    INVESTMENT_CONFIRMED,
                    PROFIT_CREDITED,
                    SCHEME_MATURED,
                    KYC_APPROVED,
                    KYC_REJECTED,
                    BANK_DETAILS_UPDATED,
                    REMITTER_ONBOARDED,
                    LIMIT_UPDATED,
                    LOW_ALLOCATION_BALANCE,
                    PASSWORD_CHANGED ->
                true;

            // Admin action-required emails
            case WITHDRAWAL_REQUESTED, KYC_SUBMITTED, KYC_UPDATED -> role == ReceiverType.Admin;

            // Routine operational events only need In-App SSE (no email clutter)
            case FUND_TRANSFER_INITIATED,
                    SETTLEMENT_SUBMITTED,
                    SCHEME_MATURITY_REMINDER,
                    LOGIN ->
                false;
        };
    }

    private ActivityType toActivityType(EssentialActionType action) {
        return switch (action) {
            case WITHDRAWAL_REQUESTED -> ActivityType.WITHDRAWAL_REQUESTED;
            case WITHDRAWAL_APPROVED -> ActivityType.WITHDRAWAL_APPROVED;
            case WITHDRAWAL_REJECTED -> ActivityType.WITHDRAWAL_REJECTED;
            case WITHDRAWAL_DISBURSED -> ActivityType.WITHDRAWAL_PROCESSED;
            case FUND_TRANSFER_INITIATED -> ActivityType.DEPOSIT_REQUESTED;
            case FUND_TRANSFER_COMPLETED -> ActivityType.DEPOSIT_COMPLETED;
            case KYC_SUBMITTED, KYC_UPDATED -> ActivityType.KYC_SUBMITTED;
            case KYC_APPROVED -> ActivityType.KYC_APPROVED;
            case KYC_REJECTED -> ActivityType.KYC_REJECTED;
            case BANK_DETAILS_UPDATED -> ActivityType.ACCOUNT_UPDATED;
            case INVESTMENT_CONFIRMED -> ActivityType.SCHEME_ENROLLED;
            case PROFIT_CREDITED, SCHEME_MATURED -> ActivityType.SCHEME_WITHDRAWAL;
            case REMITTER_ONBOARDED -> ActivityType.REMITTER_ADDED;
            case LIMIT_UPDATED, LOW_ALLOCATION_BALANCE, SETTLEMENT_SUBMITTED -> ActivityType.REMITTER_UPDATED;
            case LOGIN -> ActivityType.LOGIN;
            case PASSWORD_CHANGED -> ActivityType.PASSWORD_CHANGED;
            case SCHEME_MATURITY_REMINDER -> null;
            case PAYMENT_FAILED -> null;
        };
    }
}