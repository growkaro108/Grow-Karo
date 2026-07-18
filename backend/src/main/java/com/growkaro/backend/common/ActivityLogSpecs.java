package com.growkaro.backend.common;

import org.springframework.data.jpa.domain.Specification;

import com.growkaro.backend.entity.ActivityLog;
import com.growkaro.backend.entity.ActivityType;

import java.time.Instant;

public final class ActivityLogSpecs {

    private ActivityLogSpecs() {
    }

    public static Specification<ActivityLog> hasActorId(Long actorId) {
        return (root, query, cb) -> actorId == null ? null : cb.equal(root.get("actorId"), actorId);
    }

    public static Specification<ActivityLog> hasType(ActivityType type) {
        return (root, query, cb) -> type == null ? null : cb.equal(root.get("type"), type);
    }

    public static Specification<ActivityLog> createdBetween(Instant from, Instant to) {
        return (root, query, cb) -> {
            if (from == null && to == null)
                return null;
            if (from != null && to != null)
                return cb.between(root.get("createdAt"), from, to);
            return from != null
                    ? cb.greaterThanOrEqualTo(root.get("createdAt"), from)
                    : cb.lessThanOrEqualTo(root.get("createdAt"), to);
        };
    }
}
