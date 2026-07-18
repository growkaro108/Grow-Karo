package com.growkaro.backend.service;

import com.growkaro.backend.common.ActivityLogBroadcaster;
import com.growkaro.backend.common.ActivityLogSpecs;
import com.growkaro.backend.entity.ActivityLog;
import com.growkaro.backend.entity.ActivityType;
import com.growkaro.backend.repository.ActivityLogRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Map;

@Service
public class ActivityLogService {

    private final ActivityLogRepository repo;
    private final tools.jackson.databind.ObjectMapper objectMapper;
    private final ActivityLogBroadcaster broadcaster;

    public ActivityLogService(ActivityLogRepository repo,
            tools.jackson.databind.ObjectMapper objectMapper,
            ActivityLogBroadcaster broadcaster) {
        this.repo = repo;
        this.objectMapper = objectMapper;
        this.broadcaster = broadcaster;
    }

    /**
     * Call this at the point where a business action actually happens
     * (e.g. inside WithdrawalService.requestWithdrawal). It persists the
     * log row and immediately pushes it to every connected admin tab.
     */
    public void log(String actorId, String actorName, String actorRole,
            ActivityType type, String description,
            String targetType, String targetId, Object metadata) {

        ActivityLog entry = new ActivityLog();
        entry.setActorId(actorId);
        entry.setActorName(actorName);
        entry.setActorRole(actorRole);
        entry.setType(type);
        entry.setDescription(description);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setIpAddress(getCurrentRequestIp());

        try {
            entry.setMetadata(objectMapper.writeValueAsString(
                    metadata != null ? metadata : Map.of()));
        } catch (Exception e) {
            entry.setMetadata("{}");
        }

        entry = repo.save(entry);
        broadcaster.broadcast(entry);
    }

    public Page<ActivityLog> search(Long actorId, ActivityType type,
            Instant from, Instant to, Pageable pageable) {
        Specification<ActivityLog> spec = Specification
                .where(ActivityLogSpecs.hasActorId(actorId))
                .and(ActivityLogSpecs.hasType(type))
                .and(ActivityLogSpecs.createdBetween(from, to));
        return repo.findAll(spec, pageable);
    }

    private String getCurrentRequestIp() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            String forwardedFor = attrs.getRequest().getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                return forwardedFor.split(",")[0].trim();
            }
            return attrs.getRequest().getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
