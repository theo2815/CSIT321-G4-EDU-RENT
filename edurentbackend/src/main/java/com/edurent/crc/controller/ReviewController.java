package com.edurent.crc.controller;

import java.util.HashSet; // Updated
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

import com.edurent.crc.dto.ListingDTO;
import com.edurent.crc.dto.ReviewDTO;
import com.edurent.crc.dto.ReviewImageDTO;
import com.edurent.crc.dto.UserDTO;
import com.edurent.crc.entity.ListingImageEntity;
import com.edurent.crc.entity.ReviewEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.service.ReviewService;


@RestController
@RequestMapping("/api/v1/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsReceivedByUser(@PathVariable Long userId) {
        List<ReviewEntity> reviews = reviewService.getReviewsForUser(userId);
        
        List<ReviewDTO> reviewDTOs = reviews.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(reviewDTOs);
    }
    
    // Helper method to convert Entity to DTO
    private ReviewDTO convertToDTO(ReviewEntity review) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getReviewId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());

        // --- Map Images ---
        if (review.getImages() != null) {
            Set<Long> seenIds = new HashSet<>();
            dto.setReviewImages(review.getImages().stream()
                .filter(img -> seenIds.add(img.getImageId())) // Only allow unique IDs
                .map(img -> new ReviewImageDTO(img.getImageId(), img.getImageUrl()))
                .collect(Collectors.toList()));
        }

        if (review.getReviewer() != null) {
            dto.setReviewer(new UserDTO(
                review.getReviewer().getUserId(),
                review.getReviewer().getFullName(),
                review.getReviewer().getProfilePictureUrl()
            ));
        }

        try {
            TransactionEntity transaction = review.getTransaction();
            if (transaction != null) {
                if (transaction.getBuyer() != null && review.getReviewer() != null) {
                    if (transaction.getBuyer().getUserId().equals(review.getReviewer().getUserId())) {
                        dto.setReviewerRole("BUYER");
                    } else {
                        dto.setReviewerRole("SELLER");
                    }
                }
            if (transaction.getListing() != null) {
                ListingDTO listingDto = new ListingDTO();
                listingDto.setListingId(transaction.getListing().getListingId());
                listingDto.setTitle(transaction.getListing().getTitle());
                listingDto.setPrice(transaction.getListing().getPrice());
                // Prioritize the image marked as "Cover Photo"

                if (transaction.getListing().getImages() != null && !transaction.getListing().getImages().isEmpty()) {
                    String coverUrl = transaction.getListing().getImages().stream()
                        .filter(img -> Boolean.TRUE.equals(img.getCoverPhoto())) // Look for cover photo
                        .map(ListingImageEntity::getImageUrl)
                        .findFirst()
                        .orElse(transaction.getListing().getImages().iterator().next().getImageUrl()); // Fallback to first
                    
                    listingDto.setImageUrl(coverUrl);
                }
                dto.setListing(listingDto);
            }
        }
        } catch (jakarta.persistence.EntityNotFoundException | org.hibernate.ObjectNotFoundException e) {
            System.err.println("Warning: Review " + review.getReviewId() + " points to a missing transaction.");
            dto.setReviewerRole("UNKNOWN"); 
        }
        return dto;
    }
    
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<ReviewEntity> getReviewByTransaction(@PathVariable Long transactionId) {
        return reviewService.getReviewByTransactionId(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- UPDATED CREATE ENDPOINT ---
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ReviewEntity> createReview(
            @RequestParam("rating") Integer rating,
            @RequestParam("comment") String comment,
            @RequestParam("transactionId") Long transactionId,
            @RequestParam("reviewerId") Long reviewerId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            ReviewEntity review = new ReviewEntity();
            review.setRating(rating);
            review.setComment(comment);

            ReviewEntity newReview = reviewService.createReview(review, transactionId, reviewerId, images);
            return new ResponseEntity<>(newReview, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping(value = "/{reviewId}", consumes = {"multipart/form-data"}) // Change to multipart
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable Long reviewId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) List<Long> imagesToDelete, // New param
            @RequestPart(value = "newImages", required = false) List<MultipartFile> newImages, // New param
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            ReviewEntity updated = reviewService.updateReview(
                reviewId, 
                currentUser.getUserId(), 
                rating, 
                comment, 
                imagesToDelete, 
                newImages
            );
            return ResponseEntity.ok(convertToDTO(updated));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            reviewService.deleteReview(reviewId, currentUser.getUserId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}

