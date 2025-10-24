package com.edurent.crc.service;

import com.edurent.crc.entity.LikeEntity; // Updated
import com.edurent.crc.entity.LikeIdEntity;
import com.edurent.crc.entity.ListingEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.LikeRepository;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LikeService {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    public List<LikeEntity> getLikesForUser(Long userId) { // Updated
        return likeRepository.findById_UserId(userId);
    }

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

    public void unlikeListing(Long userId, Long listingId) {
        LikeIdEntity likeId = new LikeIdEntity(userId, listingId);
        if (!likeRepository.existsById(likeId)) {
            throw new RuntimeException("Like not found.");
        }
        likeRepository.deleteById(likeId);
    }
}

