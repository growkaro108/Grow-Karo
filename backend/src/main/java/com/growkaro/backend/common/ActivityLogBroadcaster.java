package com.growkaro.backend.common;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.growkaro.backend.entity.ActivityLog;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Holds one SseEmitter per connected admin browser tab and fans out
 * activity events to all of them.
 *
 * A periodic heartbeat is sent so that idle proxies / load balancers
 * (which often kill connections silent for >60s) don't force the
 * browser to reconnect over and over — that reconnect storm is the
 * most common cause of "too many requests" complaints with SSE.
 */
@Component
public class ActivityLogBroadcaster {

    // No timeout: browser holds this open indefinitely until it (or the network)
    // closes it.
    private static final long EMITTER_TIMEOUT = 0L;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // Send an immediate "connected" event so the frontend can flip its
        // status badge to "live" as soon as the handshake completes.
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(ActivityLog log) {
        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("activity").data(log));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    /**
     * Heartbeat every 25s — well under typical 60s proxy/load-balancer idle
     * timeouts (e.g. Nginx default, many cloud LBs). Keeps the connection
     * alive on both sides without the client ever needing to reconnect.
     */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    public int activeConnections() {
        return emitters.size();
    }
}
