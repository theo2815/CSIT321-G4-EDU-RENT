package com.edurent.crc.controller;

import com.edurent.crc.entity.ReviewEntity; // Updated
import com.edurent.crc.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/user/{userId}")
    public List<ReviewEntity> getReviewsForUser(@PathVariable Long userId) { // Updated
        return reviewService.getReviewsForUser(userId);
    }
    
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<ReviewEntity> getReviewByTransaction(@PathVariable Long transactionId) { // Updated
        return reviewService.getReviewByTransactionId(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ReviewEntity> createReview(@RequestBody ReviewEntity review, // Updated
                                               @RequestParam Long transactionId,
                                               @RequestParam Long reviewerId) {
        try {
            ReviewEntity newReview = reviewService.createReview(review, transactionId, reviewerId); // Updated
            return new ResponseEntity<>(newReview, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

