package com.edurent.crc.controller;

import org.springframework.lang.NonNull;
import java.util.Objects;

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

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // --- UPDATED: Secure endpoint to get *only* the logged-in user's notifications
    // ---
    @GetMapping("/my-notifications")
    public ResponseEntity<List<NotificationEntity>> getMyNotifications(
            Authentication authentication, // Get user from token
            @RequestParam(required = false) Boolean unread) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        Long userId = Objects.requireNonNull(currentUser.getUserId());

        List<NotificationEntity> notifications;
        if (Boolean.TRUE.equals(unread)) {
            notifications = notificationService.getUnreadNotificationsForUser(userId);
        } else {
            notifications = notificationService.getNotificationsForUser(userId);
        }

        // NOTE: Notification preferences control whether NEW notifications are created,
        // not whether existing notifications are visible. All existing notifications
        // should be returned regardless of current preference settings.
        // Filtering is intentionally NOT applied here.

        return ResponseEntity.ok(notifications);
    }
    // --- END UPDATED Endpoint ---

    // --- UPDATED: Securely mark one as read ---
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationEntity> markAsRead(
            @PathVariable @NonNull Long notificationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            // Pass user ID to the service for ownership check
            NotificationEntity updatedNotification = notificationService.markAsRead(notificationId,
                    Objects.requireNonNull(currentUser.getUserId()));
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
            notificationService.markAllAsRead(Objects.requireNonNull(currentUser.getUserId()));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    // --- END NEW ENDPOINT ---

    // --- NEW ENDPOINT: Delete Notification ---
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable @NonNull Long notificationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            // Pass user ID for ownership check
            notificationService.deleteNotification(notificationId, Objects.requireNonNull(currentUser.getUserId()));
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
            @PathVariable @NonNull Long notificationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            // Pass user ID to the service for ownership check
            NotificationEntity updatedNotification = notificationService.markAsUnread(notificationId,
                    Objects.requireNonNull(currentUser.getUserId()));
            return ResponseEntity.ok(updatedNotification);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    // --- END NEW ENDPOINT ---
}
