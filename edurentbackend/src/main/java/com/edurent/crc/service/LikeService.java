package com.edurent.crc.service;

import java.util.List; // Updated
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service; // Updated
import org.springframework.transaction.annotation.Transactional; // Updated

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
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // --- UPDATED METHOD ---
    @Transactional(readOnly = true) // <-- Add Transactional
    public List<ListingEntity> getLikedListings(Long userId) {
        // This now calls the new repository method which eagerly fetches
        // everything we need, preventing the LazyInitializationException.
        return likeRepository.findLikedListingsByUserId(userId);
    }
    // --- END UPDATED METHOD ---

    @Transactional
    public LikeEntity likeListing(Long userId, Long listingId) { // Updated
        UserEntity user = userRepository.findById(userId) // Updated
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        ListingEntity listing = listingRepository.findByIdWithUser(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);
        if (likeRepository.existsById(likeId)) {
            throw new IllegalStateException("User has already liked this listing.");
        }

        // --- NEW: Notification Logic ---
        UserEntity owner = listing.getUser();
        if (owner == null) {
             throw new RuntimeException("Listing has no owner."); // Safety check
        }

        // Only send a notification if the liker is not the owner
        if (!user.getUserId().equals(owner.getUserId())) {
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(owner); // Set the notification *for the owner*
            notification.setType("NEW_LIKE");
            
            // Create a descriptive message
            String content = String.format("%s liked your listing: '%s'", 
                                        user.getFullName(), 
                                        listing.getTitle());
            notification.setContent(content);
            
            // Create a link for the frontend
            String linkUrl = String.format("/listing/%d", listing.getListingId());
            notification.setLinkUrl(linkUrl);
            
            // isRead defaults to false, createdAt defaults to now
            
            notificationRepository.save(notification);
        }
        // --- END: Notification Logic ---

        LikeEntity like = new LikeEntity(likeId, user, listing); // Updated
        return likeRepository.save(like);
    }
    // --- UPDATED METHOD ---
    @Transactional
    public void unlikeListing(Long userId, Long listingId) {
        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);
        
        // 1. Find the like to get the entities *before* deleting
        Optional<LikeEntity> likeOptional = likeRepository.findById(likeId);
        
        if (likeOptional.isEmpty()) {
            System.out.println("Like not found, nothing to delete.");
            return;
        }

        // We can't use the entities after deleting, so get the data we need now.
        // We MUST fetch the full objects inside the transaction.
        UserEntity unliker = userRepository.findById(userId)
                .orElse(null);
        ListingEntity listing = listingRepository.findByIdWithUser(listingId) // Use eager fetch
                .orElse(null); 
        
        if (unliker == null || listing == null) {
             System.err.println("Could not find user or listing for unlike notification deletion.");
             // Still delete the like, but skip notification logic
             likeRepository.deleteById(likeId);
             return;
        }
        
        UserEntity owner = listing.getUser(); // This is now safe to access

        // 2. Delete the like
        likeRepository.deleteById(likeId);

        // 3. Find and delete the corresponding notification
        if (owner != null && !unliker.getUserId().equals(owner.getUserId())) {
            // Re-create the exact content string
            String contentToDelete = String.format("<strong>%s</strong> liked your listing: <strong>%s</strong>", 
                                                   unliker.getFullName(), 
                                                   listing.getTitle());
            
            // Find the notification
            Optional<NotificationEntity> notifOptional = notificationRepository
                .findByTypeAndUser_UserIdAndContent("NEW_LIKE", owner.getUserId(), contentToDelete);

            // If found, delete it
            if (notifOptional.isPresent()) {
                notificationRepository.delete(notifOptional.get());
                System.out.println("Deleted corresponding 'NEW_LIKE' notification.");
            } else {
                 System.out.println("Could not find matching 'NEW_LIKE' notification to delete.");
            }
        }
    }
    // --- END UPDATED METHOD ---
}

