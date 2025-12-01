package com.edurent.crc.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // 1. Get Liked Listings for User
    @Transactional(readOnly = true)
    public List<ListingEntity> getLikedListings(Long userId) {
        return likeRepository.findLikedListingsByUserId(userId);
    }

    // 2. Like a Listing
    @Transactional
    public LikeEntity likeListing(Long userId, Long listingId) { 
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
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(owner);
            notification.setType("NEW_LIKE");
            
            String content = String.format("%s liked your listing: '%s'", 
                                        user.getFullName(), 
                                        listing.getTitle());
            notification.setContent(content);
            
            String linkUrl = String.format("/listing/%d", listing.getListingId());
            notification.setLinkUrl(linkUrl);
            
            
            notificationRepository.save(notification);
        }

        LikeEntity like = new LikeEntity(likeId, user, listing); // Updated
        return likeRepository.save(like);
    }

    // 3. Unlike a Listing
    @Transactional
    public void unlikeListing(Long userId, Long listingId) {
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
                notificationRepository.delete(notifOptional.get());
                System.out.println("Deleted corresponding 'NEW_LIKE' notification.");
            } else {
                 System.out.println("Could not find matching 'NEW_LIKE' notification to delete.");
            }
        }
    }
}

