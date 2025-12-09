package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.NotificationEntity;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    // Method to find notifications by user ID
    @Query("SELECT n FROM NotificationEntity n WHERE n.user.userId = :userId")
    List<NotificationEntity> findByUserId(@Param("userId") Long userId);

    // Method to find notifications by user ID and read status
    @Query("SELECT n FROM NotificationEntity n WHERE n.user.userId = :userId AND n.isRead = :isRead")
    List<NotificationEntity> findByUserIdAndIsRead(@Param("userId") Long userId, @Param("isRead") Boolean isRead);

    // Method to find a notification by type, user ID, and content
    Optional<NotificationEntity> findByTypeAndUser_UserIdAndContent(String type, Long userId, String content);

    // Method to find a notification by its ID and user ID
    Optional<NotificationEntity> findByNotificationIdAndUser_UserId(Long notificationId, Long userId);

    // Method to get all notifications for a user with a specific read status
    List<NotificationEntity> findAllByUser_UserIdAndIsRead(Long userId, Boolean isRead);

    // Method to mark all notifications as read for a user
    @Modifying 
    @Query("UPDATE NotificationEntity n SET n.isRead = true WHERE n.user.userId = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);

    // Find existing unread notification for a specific link (used for grouping)
    Optional<NotificationEntity> findByTypeAndUser_UserIdAndLinkUrlAndIsReadFalse(String type, Long userId, String linkUrl);

    // Find the latest notification for a specific link (read or unread) to support re-surfacing
    Optional<NotificationEntity> findFirstByTypeAndUser_UserIdAndLinkUrlOrderByCreatedAtDesc(String type, Long userId, String linkUrl);
}
