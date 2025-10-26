package com.edurent.crc.controller;

import java.util.List; // Updated

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edurent.crc.entity.ReviewEntity;
import com.edurent.crc.service.ReviewService;

@RestController
@RequestMapping("/api/v1/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewEntity>> getReviewsReceivedByUser(@PathVariable Long userId) {
        // We need a corresponding method in ReviewService
        List<ReviewEntity> reviews = reviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(reviews);
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

