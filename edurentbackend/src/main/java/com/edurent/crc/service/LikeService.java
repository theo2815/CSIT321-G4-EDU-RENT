package com.edurent.crc.service;

import java.util.List; // Updated

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service; // Updated
import org.springframework.transaction.annotation.Transactional; // Updated

import com.edurent.crc.entity.LikeEntity;
import com.edurent.crc.entity.LikeIdEntity;
import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.LikeRepository;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.UserRepository;



@Service
public class LikeService {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

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
        ListingEntity listing = listingRepository.findById(listingId) // Updated
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);
        if (likeRepository.existsById(likeId)) {
            throw new IllegalStateException("User has already liked this listing.");
        }

        LikeEntity like = new LikeEntity(likeId, user, listing); // Updated
        return likeRepository.save(like);
    }
    @Transactional
    public void unlikeListing(Long userId, Long listingId) {
        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);
        if (!likeRepository.existsById(likeId)) {
            System.out.println("Like not found, nothing to delete.");
            return;
        }
        likeRepository.deleteById(likeId);
    }
}

