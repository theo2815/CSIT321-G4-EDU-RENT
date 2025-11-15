package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // Import this
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.NotificationEntity;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    @Query("SELECT n FROM NotificationEntity n WHERE n.user.userId = :userId")
    List<NotificationEntity> findByUserId(@Param("userId") Long userId);

    @Query("SELECT n FROM NotificationEntity n WHERE n.user.userId = :userId AND n.isRead = :isRead")
    List<NotificationEntity> findByUserIdAndIsRead(@Param("userId") Long userId, @Param("isRead") Boolean isRead);

    Optional<NotificationEntity> findByTypeAndUser_UserIdAndContent(String type, Long userId, String content);

    // --- NEW METHOD 1: Find a notification by its ID and the user who owns it ---
    Optional<NotificationEntity> findByNotificationIdAndUser_UserId(Long notificationId, Long userId);

    // --- NEW METHOD 2: Find all unread notifications for a user ---
    // (This is an alternative to the @Query version above, using Spring Data JPA keywords)
    List<NotificationEntity> findAllByUser_UserIdAndIsRead(Long userId, Boolean isRead);

    // --- NEW METHOD 3: Mark all as read for a user ---
    @Modifying // Indicates this query will change data
    @Query("UPDATE NotificationEntity n SET n.isRead = true WHERE n.user.userId = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);
}
