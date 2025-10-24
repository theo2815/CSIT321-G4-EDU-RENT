package com.edurent.crc.controller;

import com.edurent.crc.entity.NotificationEntity; // Updated
import com.edurent.crc.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public List<NotificationEntity> getNotifications(@PathVariable Long userId, @RequestParam(required = false) Boolean unread) { // Updated
        if (Boolean.TRUE.equals(unread)) {
            return notificationService.getUnreadNotificationsForUser(userId);
        }
        return notificationService.getNotificationsForUser(userId);
    }

    @PostMapping
    public ResponseEntity<NotificationEntity> createNotification(@RequestBody NotificationEntity notification, // Updated
                                                           @RequestParam Long userId) {
        try {
            NotificationEntity newNotification = notificationService.createNotification(notification, userId); // Updated
            return new ResponseEntity<>(newNotification, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationEntity> markAsRead(@PathVariable Long notificationId) { // Updated
        try {
            NotificationEntity updatedNotification = notificationService.markAsRead(notificationId); // Updated
            return ResponseEntity.ok(updatedNotification);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

