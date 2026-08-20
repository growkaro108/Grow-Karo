package com.growkaro.backend.repository;

import com.growkaro.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    // ── Fetch for user ────────────────────────────────────────────────────────

    Page<Notification> findByReceiverId(String receiverId, Pageable pageable);

    // Page<Notification> findByReceiverIdAndRead(String receiverId, boolean read,
    // Pageable pageable);

    // List<Notification> findByReceiverIdAndReadOrderByCreatedAtDesc(String
    // receiverId, boolean read);

    // // ── Specific type ─────────────────────────────────────────────────────────

    // Page<Notification> findByReceiverIdAndType(String receiverId,
    // NotificationType type, Pageable pageable);

    // // ── Count ─────────────────────────────────────────────────────────────────

    // long countByReceiverIdAndRead(String receiverId, boolean read);

    // ── Bulk mark as read ─────────────────────────────────────────────────────

    // @Modifying
    // @Transactional
    // @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND
    // n.id IN :ids")
    // int markAsRead(@Param("userId") String userId, @Param("ids") List<String>
    // ids);

    // @Modifying
    // @Transactional
    // @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId")
    // int markAllAsRead(@Param("userId") String userId);

    // // ── Delete old notifications ──────────────────────────────────────────────

    // @Modifying
    // @Transactional
    // @Query("DELETE FROM Notification n WHERE n.user.id = :userId AND n.read =
    // true")
    // int deleteReadByUser(@Param("userId") String userId);
}
