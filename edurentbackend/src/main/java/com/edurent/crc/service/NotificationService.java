package com.edurent.crc.service;

import com.edurent.crc.entity.NotificationEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.NotificationRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

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
}

