package com.edurent.crc.service;

import java.util.List; 

import org.springframework.beans.factory.annotation.Autowired; 
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

    // Get Notifications for User
    public List<NotificationEntity> getNotificationsForUser(Long userId) { 
        return notificationRepository.findByUserId(userId);
    }
    
    // Get Unread Notifications for User
    public List<NotificationEntity> getUnreadNotificationsForUser(Long userId) { 
        return notificationRepository.findByUserIdAndIsRead(userId, false);
    }

    // Create Notification
    public NotificationEntity createNotification(NotificationEntity notification, Long userId) { 
        UserEntity user = userRepository.findById(userId) 
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        notification.setUser(user);
        return notificationRepository.save(notification);
    }

    // Mark as Read without Ownership Check
    public NotificationEntity markAsRead(Long notificationId) { 
        NotificationEntity notification = notificationRepository.findById(notificationId) 
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    // Mark as Read for User with Ownership Check
    @Transactional
    public NotificationEntity markAsRead(Long notificationId, Long userId) {
        NotificationEntity notification = notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new AccessDeniedException("Notification not found or user does not have permission."));
        
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    // Mark as Unread
    @Transactional
    public NotificationEntity markAsUnread(Long notificationId, Long userId) {
        NotificationEntity notification = notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new AccessDeniedException("Notification not found or user does not have permission."));
        
        notification.setIsRead(false); 
        return notificationRepository.save(notification);
    }

    // Mark All as Read
    @Transactional
    public void markAllAsRead(Long userId) {
        int updatedCount = notificationRepository.markAllAsReadByUserId(userId);
        System.out.println("Marked " + updatedCount + " notifications as read for user " + userId);
    }

    // Delete Notification
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        NotificationEntity notification = notificationRepository.findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new AccessDeniedException("Notification not found or user does not have permission."));
        
        notificationRepository.delete(notification);
    }
}

