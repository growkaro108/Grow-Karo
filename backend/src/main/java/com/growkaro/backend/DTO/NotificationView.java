package com.growkaro.backend.DTO;

import java.time.LocalDateTime;

import com.growkaro.backend.entity.Notification;

public record NotificationView(
        String id,
        String title,
        String message,
        String type,
        String actionType,
        boolean read,
        String actionUrl,
        LocalDateTime createdAt, LocalDateTime updatedAt) {

    // Forconvenience when mapping from entity
    public static NotificationView fromEntity(Notification n) {
        if (n == null) {
            return null;
        }
        return new NotificationView(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getNotificationType().name(),
                n.getActionType().name(),
                n.isRead(),
                n.getActionUrl(),
                n.getCreatedAt(),
                n.getUpdatedAt());
    }
}
