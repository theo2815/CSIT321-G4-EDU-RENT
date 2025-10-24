package com.edurent.crc.controller;

import com.edurent.crc.entity.LikeEntity; // Updated
import com.edurent.crc.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/likes")
@CrossOrigin(origins = "*")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @GetMapping("/user/{userId}")
    public List<LikeEntity> getLikesForUser(@PathVariable Long userId) { // Updated
        return likeService.getLikesForUser(userId);
    }

    @PostMapping
    public ResponseEntity<LikeEntity> likeListing(@RequestParam Long userId, @RequestParam Long listingId) { // Updated
        try {
            LikeEntity newLike = likeService.likeListing(userId, listingId); // Updated
            return new ResponseEntity<>(newLike, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @DeleteMapping
    public ResponseEntity<Void> unlikeListing(@RequestParam Long userId, @RequestParam Long listingId) {
        try {
            likeService.unlikeListing(userId, listingId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

