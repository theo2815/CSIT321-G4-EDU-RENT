package com.edurent.crc.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.service.NotificationService;
import com.edurent.crc.service.NotificationPreferenceService;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationPreferenceService notificationPreferenceService;

    // --- UPDATED: Secure endpoint to get *only* the logged-in user's notifications ---
    @GetMapping("/my-notifications")
    public ResponseEntity<List<NotificationEntity>> getMyNotifications(
            Authentication authentication, // Get user from token
            @RequestParam(required = false) Boolean unread
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        Long userId = currentUser.getUserId();
        
        List<NotificationEntity> notifications;
        if (Boolean.TRUE.equals(unread)) {
            notifications = notificationService.getUnreadNotificationsForUser(userId);
        } else {
            notifications = notificationService.getNotificationsForUser(userId);
        }
        // Apply backend filtering based on preferences
        var prefs = notificationPreferenceService.getPreferencesForUser(userId);
        boolean allowAll = prefs.getOrDefault("all_notifications", true);
        boolean allowLikes = prefs.getOrDefault("likes", true);
        boolean allowMessages = prefs.getOrDefault("messages", true);

        if (!allowAll) {
            notifications.removeIf(n -> {
                String type = n.getType();
                if ("NEW_LIKE".equals(type)) return !allowLikes;
                if ("NEW_MESSAGE".equals(type)) return !allowMessages;
                // For any other types, block when all is off
                return true;
            });
        }
        return ResponseEntity.ok(notifications);
    }
    // --- END UPDATED Endpoint ---


    // --- UPDATED: Securely mark one as read ---
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationEntity> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            // Pass user ID to the service for ownership check
            NotificationEntity updatedNotification = notificationService.markAsRead(notificationId, currentUser.getUserId());
            return ResponseEntity.ok(updatedNotification);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // --- NEW ENDPOINT: Mark All as Read ---
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            notificationService.markAllAsRead(currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    // --- END NEW ENDPOINT ---

    // --- NEW ENDPOINT: Delete Notification ---
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long notificationId,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            // Pass user ID for ownership check
            notificationService.deleteNotification(notificationId, currentUser.getUserId());
            return ResponseEntity.noContent().build(); // 204
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    // --- END NEW ENDPOINT ---

    // --- NEW ENDPOINT: Mark as Unread ---
    @PutMapping("/{notificationId}/unread")
    public ResponseEntity<NotificationEntity> markAsUnread(
            @PathVariable Long notificationId,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            // Pass user ID to the service for ownership check
            NotificationEntity updatedNotification = notificationService.markAsUnread(notificationId, currentUser.getUserId());
            return ResponseEntity.ok(updatedNotification);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    // --- END NEW ENDPOINT ---
}

