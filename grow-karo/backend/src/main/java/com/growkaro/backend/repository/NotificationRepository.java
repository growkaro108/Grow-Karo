package com.growkaro.backend.repository;

import com.growkaro.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    // ── Fetch for user ────────────────────────────────────────────────────────

    Page<Notification> findByUserId(String userId, Pageable pageable);

    Page<Notification> findByUserIdAndRead(String userId, boolean read, Pageable pageable);

    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(String userId, boolean read);

    // ── Specific type ─────────────────────────────────────────────────────────

    Page<Notification> findByUserIdAndType(String userId, Notification.Type type, Pageable pageable);

    // ── Count ─────────────────────────────────────────────────────────────────

    long countByUserIdAndRead(String userId, boolean read);

    // ── Bulk mark as read ─────────────────────────────────────────────────────

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.id IN :ids")
    int markAsRead(@Param("userId") String userId, @Param("ids") List<String> ids);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId")
    int markAllAsRead(@Param("userId") String userId);

    // ── Delete old notifications ──────────────────────────────────────────────

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId AND n.read = true")
    int deleteReadByUser(@Param("userId") String userId);
}
