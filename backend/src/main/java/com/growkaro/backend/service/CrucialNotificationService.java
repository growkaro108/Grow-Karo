package com.growkaro.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.growkaro.backend.DRO.RecipientContact;
import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.NotificationContentBuilder;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.NotificationContentBuilder.EssentialActionType;
import com.growkaro.backend.repository.NotificationRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrucialNotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final NotificationContentBuilder contentBuilder;

    /**
     * Fires the full flow: user + all admins + remitter (as a User).
     * Runs async so it never blocks the calling transaction (e.g. the
     * actual fund transfer / withdrawal logic).
     */
    @Async
    public void notifyEssentialAction(EssentialActionType action,
            User user,
            List<User> admins,
            User remitter,
            String actionUrl,
            Map<String, Object> params) {

        notifyInternalUser(action, user, actionUrl, params);

        if (admins != null) {
            admins.forEach(admin -> notifyInternalUser(action, admin, actionUrl, params));
        }

        if (remitter != null) {
            notifyInternalUser(action, remitter, actionUrl, params);
        }
    }

    /** Overload for when the remitter is external (no User row) - email only. */
    @Async
    public void notifyEssentialAction(EssentialActionType action,
            User user,
            List<User> admins,
            RecipientContact externalRemitter,
            String actionUrl,
            Map<String, Object> params) {

        notifyInternalUser(action, user, actionUrl, params);

        if (admins != null) {
            admins.forEach(admin -> notifyInternalUser(action, admin, actionUrl, params));
        }

        if (externalRemitter != null) {
            notifyExternalContact(action, externalRemitter, params);
        }
    }

    /**
     * Persists an in-app Notification + sends an email for a single internal User.
     */
    @Transactional
    public void notifyInternalUser(EssentialActionType action, User user, String actionUrl,
            Map<String, Object> params) {
        if (user == null) {
            log.debug("Skipping notification for action {} - user is null", action);
            return;
        }

        String recipientName = user.getName(); // adjust getter if your User uses e.g. getFullName()
        String recipientEmail = user.getEmail();

        // 1. Persist in-app notification
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(contentBuilder.buildPlainMessage(action, recipientName, params));
        notification.setType(contentBuilder.toNotificationType(action));
        notification.setActionUrl(actionUrl);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);

        // 2. Send email
        String subject = contentBuilder.buildSubject(action);
        String htmlBody = contentBuilder.buildHtmlBody(action, recipientName, params);
        emailService.sendHtml(recipientEmail, subject, htmlBody);
    }

    /**
     * Email-only path for recipients without a User row (e.g. external remitter).
     */
    public void notifyExternalContact(EssentialActionType action, RecipientContact contact,
            Map<String, Object> params) {
        if (contact == null) {
            return;
        }
        String subject = contentBuilder.buildSubject(action);
        String htmlBody = contentBuilder.buildHtmlBody(action, contact.getName(), params);
        emailService.sendHtml(contact.getEmail(), subject, htmlBody);
    }
}