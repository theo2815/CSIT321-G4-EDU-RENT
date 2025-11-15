package com.edurent.crc.service;

import java.util.List; // Updated

import org.springframework.beans.factory.annotation.Autowired; // Updated
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.NotificationRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<NotificationEntity> getNotificationsForUser(Long userId) { // Updated
        return notificationRepository.findByUserId(userId);
    }
    
    public List<NotificationEntity> getUnreadNotificationsForUser(Long userId) { // Updated
        return notificationRepository.findByUserIdAndIsRead(userId, false);
    }

    public NotificationEntity createNotification(NotificationEntity notification, Long userId) { // Updated
        UserEntity user = userRepository.findById(userId) // Updated
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        notification.setUser(user);
        return notificationRepository.save(notification);
    }

    public NotificationEntity markAsRead(Long notificationId) { // Updated
        NotificationEntity notification = notificationRepository.findById(notificationId) // Updated
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }
    // --- UPDATED Method: Add Security Check ---
    @Transactional
    public NotificationEntity markAsRead(Long notificationId, Long userId) {
        NotificationEntity notification = notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new AccessDeniedException("Notification not found or user does not have permission."));
        
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    // --- NEW METHOD: Mark as Unread ---
    @Transactional
    public NotificationEntity markAsUnread(Long notificationId, Long userId) {
        NotificationEntity notification = notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new AccessDeniedException("Notification not found or user does not have permission."));
        
        notification.setIsRead(false); // Set to false
        return notificationRepository.save(notification);
    }
    // --- END NEW METHOD ---

    // --- NEW METHOD: Mark All as Read ---
    @Transactional
    public void markAllAsRead(Long userId) {
        int updatedCount = notificationRepository.markAllAsReadByUserId(userId);
        System.out.println("Marked " + updatedCount + " notifications as read for user " + userId);
    }
    // --- END NEW METHOD ---

    // --- NEW METHOD: Delete Notification ---
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        // Find by both ID and User ID to ensure the user owns this notification
        NotificationEntity notification = notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new AccessDeniedException("Notification not found or user does not have permission."));
        
        notificationRepository.delete(notification);
    }
    // --- END NEW METHOD ---
}

