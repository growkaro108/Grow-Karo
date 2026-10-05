package com.growkaro.backend.common;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Notification.ReceiverType;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE Broadcaster for Real-time Notifications.
 * Supports channels for:
 * - Specific Users (keyed by "USER:{userId}")
 * - Specific Remitters (keyed by "REMITTER:{remitterId}")
 * - All Admins (keyed by "ADMIN_GLOBAL" or "ADMIN:{adminId}")
 */
@Slf4j
@Component
public class NotificationBroadcaster {

    private static final long EMITTER_TIMEOUT = 0L; // Keep connection open indefinitely until client disconnects

    // Keyed by channel ID e.g. "USER:usr123", "REMITTER:rem123", "ADMIN:GLOBAL",
    // "ADMIN:adm123"
    private final Map<String, List<SseEmitter>> channels = new ConcurrentHashMap<>();

    /**
     * Subscribe a client to their notification stream.
     */
    public SseEmitter subscribe(ReceiverType receiverType, String receiverId) {
        String channelKey = buildChannelKey(receiverType, receiverId);
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

        channels.computeIfAbsent(channelKey, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(channelKey, emitter));
        emitter.onTimeout(() -> removeEmitter(channelKey, emitter));
        emitter.onError((e) -> removeEmitter(channelKey, emitter));

        // Send initial connected event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "channel", channelKey, "timestamp",
                            System.currentTimeMillis())));
        } catch (IOException e) {
            removeEmitter(channelKey, emitter);
        }

        return emitter;
    }

    /**
     * Send a notification to a specific receiver (User, Remitter, or Admin).
     */
    public void sendToReceiver(ReceiverType receiverType, String receiverId, Notification notification) {
        String channelKey = buildChannelKey(receiverType, receiverId);
        pushToChannel(channelKey, notification);

        // If it's an admin notification, also push to the global admin stream
        if (receiverType == ReceiverType.Admin) {
            pushToChannel("ADMIN:GLOBAL", notification);
        }
    }

    /**
     * Broadcast to all connected Admins.
     */
    public void broadcastToAdmins(Notification notification) {
        pushToChannel("ADMIN:GLOBAL", notification);
    }

    private void pushToChannel(String channelKey, Notification notification) {
        List<SseEmitter> emitters = channels.get(channelKey);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
            } catch (IOException | RuntimeException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    private void removeEmitter(String channelKey, SseEmitter emitter) {
        List<SseEmitter> list = channels.get(channelKey);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                channels.remove(channelKey);
            }
        }
    }

    private String buildChannelKey(ReceiverType receiverType, String receiverId) {
        if (receiverType == null) {
            return "UNKNOWN:" + (receiverId != null ? receiverId : "GLOBAL");
        }
        // Admin global broadcast channel
        if (receiverType == ReceiverType.Admin
                && (receiverId == null || receiverId.isBlank() || "GLOBAL".equalsIgnoreCase(receiverId))) {
            return "ADMIN:GLOBAL";
        }
        // All other cases: prefix + receiverId (never append null)
        String safeId = (receiverId != null && !receiverId.isBlank()) ? receiverId : "GLOBAL";
        return receiverType.name().toUpperCase() + ":" + safeId;
    }

    /**
     * Heartbeat every 25s to keep connections alive and prevent proxy timeouts.
     */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        // Iterate over a snapshot of keys to allow safe removal of empty entries
        for (String channelKey : channels.keySet()) {
            List<SseEmitter> emitters = channels.get(channelKey);
            if (emitters == null) continue;
            List<SseEmitter> dead = new java.util.ArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (IOException | RuntimeException e) {
                    dead.add(emitter);
                }
            }
            emitters.removeAll(dead);
            // Clean up empty channel entries to prevent unbounded map growth (memory leak)
            if (emitters.isEmpty()) {
                channels.remove(channelKey, emitters);
            }
        }
    }

    public int activeChannelsCount() {
        return channels.size();
    }
}
