package com.growkaro.backend.repository;

import com.growkaro.backend.entity.Notification;
import com.growkaro.backend.entity.Notification.ReceiverType;
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

    // ── Fetch for specific receiver (User / Remitter / Admin) ─────────────────
    Page<Notification> findByReceiverId(String receiverId, Pageable pageable);

    Page<Notification> findByReceiverIdAndReceiverType(String receiverId, ReceiverType receiverType, Pageable pageable);

    Page<Notification> findByReceiverIdAndReceiverTypeAndRead(String receiverId, ReceiverType receiverType, boolean read, Pageable pageable);

    // ── Fetch for all Admins ───────────────────────────────────────────────────
    Page<Notification> findByReceiverType(ReceiverType receiverType, Pageable pageable);

    Page<Notification> findByReceiverTypeAndRead(ReceiverType receiverType, boolean read, Pageable pageable);

    // ── Unread Counts ──────────────────────────────────────────────────────────
    long countByReceiverIdAndReceiverTypeAndRead(String receiverId, ReceiverType receiverType, boolean read);

    long countByReceiverTypeAndRead(ReceiverType receiverType, boolean read);

    long countByReceiverIdAndRead(String receiverId, boolean read);

    // ── Bulk Mark as Read ─────────────────────────────────────────────────────
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.receiverId = :receiverId AND n.receiverType = :receiverType AND n.id IN :ids")
    int markAsRead(@Param("receiverId") String receiverId, @Param("receiverType") ReceiverType receiverType, @Param("ids") List<String> ids);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.receiverId = :receiverId AND n.receiverType = :receiverType")
    int markAllAsRead(@Param("receiverId") String receiverId, @Param("receiverType") ReceiverType receiverType);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.receiverType = :receiverType")
    int markAllAdminAsRead(@Param("receiverType") ReceiverType receiverType);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.receiverType = :receiverType AND n.id IN :ids")
    int markAdminAsRead(@Param("receiverType") ReceiverType receiverType, @Param("ids") List<String> ids);
}
