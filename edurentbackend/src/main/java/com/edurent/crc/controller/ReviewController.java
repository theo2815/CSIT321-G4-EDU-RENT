package com.edurent.crc.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;

import com.edurent.crc.dto.ReviewDTO;
import com.edurent.crc.entity.ReviewEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.service.ReviewService;
import com.edurent.crc.mapper.ReviewMapper;

@RestController
@RequestMapping("/api/v1/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewMapper reviewMapper;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsReceivedByUser(@PathVariable Long userId) {
        List<ReviewEntity> reviews = reviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(reviewMapper.toDTOList(reviews));
    }

    // [NEW] Get reviews FROM BUYERS (pagination)
    @GetMapping("/user/{userId}/buyers")
    public ResponseEntity<Page<ReviewDTO>> getBuyerReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size // Default 5 as requested
    ) {
        Page<ReviewEntity> reviews = reviewService.getBuyerReviews(userId, page, size);
        return ResponseEntity.ok(reviewMapper.toDTOPage(reviews));
    }

    // [NEW] Get reviews FROM SELLERS (pagination)
    @GetMapping("/user/{userId}/sellers")
    public ResponseEntity<Page<ReviewDTO>> getSellerReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size // Default 5 as requested
    ) {
        Page<ReviewEntity> reviews = reviewService.getSellerReviews(userId, page, size);
        return ResponseEntity.ok(reviewMapper.toDTOPage(reviews));
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<ReviewDTO> getReviewByTransaction(@PathVariable Long transactionId) {
        return reviewService.getReviewByTransactionId(transactionId)
                .map(reviewMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- UPDATED CREATE ENDPOINT ---
    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<ReviewDTO> createReview(
            @RequestParam("rating") Integer rating,
            @RequestParam("comment") String comment,
            @RequestParam("transactionId") Long transactionId,
            @RequestParam("reviewerId") Long reviewerId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        try {
            ReviewEntity review = new ReviewEntity();
            review.setRating(rating);
            review.setComment(comment);

            ReviewEntity newReview = reviewService.createReview(review, transactionId, reviewerId, images);
            return new ResponseEntity<>(reviewMapper.toDTO(newReview), HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping(value = "/{reviewId}", consumes = { "multipart/form-data" }) // Change to multipart
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable Long reviewId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) List<Long> imagesToDelete, // New param
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages, // New param
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            ReviewEntity updated = reviewService.updateReview(
                    reviewId,
                    currentUser.getUserId(),
                    rating,
                    comment,
                    imagesToDelete,
                    newImages);
            return ResponseEntity.ok(reviewMapper.toDTO(updated));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            reviewService.deleteReview(reviewId, currentUser.getUserId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
