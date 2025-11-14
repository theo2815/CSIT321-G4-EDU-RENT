package com.edurent.crc.controller;

import java.util.List; // Updated

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edurent.crc.entity.LikeEntity;
import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.service.LikeService;

@RestController
@RequestMapping("/api/v1/likes")
@CrossOrigin(origins = "*")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @GetMapping("/my-likes")
    public ResponseEntity<List<ListingEntity>> getMyLikedListings(Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        List<ListingEntity> likedListings = likeService.getLikedListings(currentUser.getUserId());
        return ResponseEntity.ok(likedListings);
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<LikeEntity> likeListing(
            @PathVariable Long listingId,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            LikeEntity newLike = likeService.likeListing(currentUser.getUserId(), listingId);
            return new ResponseEntity<>(newLike, HttpStatus.CREATED);
        } catch (Exception e) {
            // Handle "already liked"
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> unlikeListing(
            @PathVariable Long listingId,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            likeService.unlikeListing(currentUser.getUserId(), listingId);
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

