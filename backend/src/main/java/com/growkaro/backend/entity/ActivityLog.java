package com.growkaro.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

import com.growkaro.backend.enums.ActivityType;

@Data
@NoArgsConstructor
@Entity
@Table(name = "activity_log", indexes = {
                @Index(name = "idx_activity_created_at", columnList = "createdAt"),
                @Index(name = "idx_activity_actor_id", columnList = "actorId"),
                @Index(name = "idx_activity_type", columnList = "type")
})
public class ActivityLog {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String actorId;
        private String actorName;
        private String actorRole;

        @Enumerated(EnumType.STRING)
        @Column(name = "type")
        private ActivityType type;

        @Column(length = 500)
        private String description;

        private String targetType;
        private String targetId;

        @Lob
        @Column(columnDefinition = "TEXT")
        private String metadata; // JSON string, e.g. {"amount":20000,"status":"PENDING"}

        private String ipAddress;

        @Column(nullable = false)
        private Instant createdAt = Instant.now();

        public ActivityLog(Long id, String actorId, String actorName, String actorRole, ActivityType type, String description, String targetType, String targetId, String metadata, String ipAddress, Instant createdAt) {
                this.id = id;
                this.actorId = actorId;
                this.actorName = actorName;
                this.actorRole = actorRole;
                this.type = type;
                this.description = description;
                this.targetType = targetType;
                this.targetId = targetId;
                this.metadata = metadata;
                this.ipAddress = ipAddress;
                this.createdAt = createdAt;
        }



}
