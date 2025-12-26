package com.edurent.crc.service;

import org.springframework.lang.NonNull;
import java.util.Objects;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.edurent.crc.entity.LikeEntity;
import com.edurent.crc.entity.LikeIdEntity;
import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.LikeRepository;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.NotificationRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class LikeService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // 1. Get Liked Listings for User
    @Transactional(readOnly = true)
    public List<ListingEntity> getLikedListings(@NonNull Long userId) {
        return likeRepository.findLikedListingsByUserId(userId);
    }

    // 2. Like a Listing
    @Transactional
    public LikeEntity likeListing(@NonNull Long userId, @NonNull Long listingId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        ListingEntity listing = listingRepository.findByIdWithUser(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);
        if (likeRepository.existsById(likeId)) {
            throw new IllegalStateException("User has already liked this listing.");
        }
        UserEntity owner = listing.getUser();
        if (owner == null) {
            throw new RuntimeException("Listing has no owner.");
        }

        if (!user.getUserId().equals(owner.getUserId())) {
            String linkUrl = String.format("/listing/%d", listing.getListingId());
            String content = String.format("%s liked your listing: '%s'",
                    user.getFullName(),
                    listing.getTitle());

            // Stock-up Logic: Check for existing like notification for this item
            NotificationEntity notification = notificationRepository
                    .findFirstByTypeAndUser_UserIdAndLinkUrlOrderByCreatedAtDesc("NEW_LIKE", owner.getUserId(), linkUrl)
                    .orElse(new NotificationEntity());

            // We update IF it's new OR if it's the same user (content check)
            boolean isSameUser = notification.getContent() != null
                    && notification.getContent().contains(user.getFullName());

            if (notification.getNotificationId() == null || isSameUser) {
                if (notification.getNotificationId() == null) {
                    notification.setUser(owner);
                    notification.setType("NEW_LIKE");
                    notification.setLinkUrl(linkUrl);
                }
                notification.setContent(content);
                notification.setCreatedAt(LocalDateTime.now()); // Bump timestamp
                notification.setIsRead(false); // Mark as unread

                NotificationEntity saved = notificationRepository.save(notification);
                messagingTemplate.convertAndSend("/topic/user." + owner.getUserId(), saved);
            } else {
                // Different user liked the same item -> Create NEW notification
                NotificationEntity newNotif = new NotificationEntity();
                newNotif.setUser(owner);
                newNotif.setType("NEW_LIKE");
                newNotif.setContent(content);
                newNotif.setLinkUrl(linkUrl);

                NotificationEntity savedNew = notificationRepository.save(newNotif);
                messagingTemplate.convertAndSend("/topic/user." + owner.getUserId(), savedNew);
            }
        }

        LikeEntity like = new LikeEntity(likeId, user, listing);
        return likeRepository.save(like);
    }

    // 3. Unlike a Listing
    @Transactional
    public void unlikeListing(@NonNull Long userId, @NonNull Long listingId) {
        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);

        // 1. Find the like to get the entities *before* deleting
        Optional<LikeEntity> likeOptional = likeRepository.findById(likeId);

        if (likeOptional.isEmpty()) {
            System.out.println("Like not found, nothing to delete.");
            return;
        }

        UserEntity unliker = userRepository.findById(userId)
                .orElse(null);
        ListingEntity listing = listingRepository.findByIdWithUser(listingId)
                .orElse(null);

        if (unliker == null || listing == null) {
            System.err.println("Could not find user or listing for unlike notification deletion.");
            likeRepository.deleteById(likeId);
            return;
        }

        UserEntity owner = listing.getUser();

        // 2. Delete the like
        likeRepository.deleteById(likeId);

        // 3. Find and delete the corresponding notification
        if (owner != null && !unliker.getUserId().equals(owner.getUserId())) {
            String contentToDelete = String.format("<strong>%s</strong> liked your listing: <strong>%s</strong>",
                    unliker.getFullName(),
                    listing.getTitle());

            Optional<NotificationEntity> notifOptional = notificationRepository
                    .findByTypeAndUser_UserIdAndContent("NEW_LIKE", owner.getUserId(), contentToDelete);

            if (notifOptional.isPresent()) {
                notificationRepository.delete(Objects.requireNonNull(notifOptional.get()));
                System.out.println("Deleted corresponding 'NEW_LIKE' notification.");
            } else {
                System.out.println("Could not find matching 'NEW_LIKE' notification to delete.");
            }
        }
    }
}
