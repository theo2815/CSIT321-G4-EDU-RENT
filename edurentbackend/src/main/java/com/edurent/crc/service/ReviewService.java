package com.edurent.crc.service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.edurent.crc.entity.ReviewEntity;
import com.edurent.crc.entity.ReviewImageEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ReviewRepository;
import com.edurent.crc.repository.TransactionRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private UserRepository userRepository;

    // --- Supabase Config ---
    @Value("${supabase.url}") private String supabaseUrl;
    @Value("${supabase.key}") private String supabaseKey;
    @Value("${supabase.review-bucket}") private String reviewBucket;

    private final RestTemplate restTemplate = new RestTemplate();

    // --- Upload Helper ---
    private String uploadImage(MultipartFile file) throws IOException {
        String filename = "review_" + UUID.randomUUID() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
        String storageUrl = supabaseUrl + "/storage/v1/object/" + reviewBucket + "/" + filename;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("apikey", supabaseKey);
        headers.setContentType(MediaType.valueOf(file.getContentType()));

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
        restTemplate.exchange(storageUrl, HttpMethod.POST, requestEntity, String.class);

        return supabaseUrl + "/storage/v1/object/public/" + reviewBucket + "/" + filename;
    }

    public List<ReviewEntity> getReviewsForUser(Long userId) {
        return reviewRepository.findWithDetailsByReviewedUserId(userId);
    }
    
    public Optional<ReviewEntity> getReviewByTransactionId(Long transactionId) {
        List<ReviewEntity> reviews = reviewRepository.findAllByTransactionId(transactionId);
        return reviews.stream().findFirst();
    }

    // --- NEW HELPER: Delete Image from Supabase ---
    private void deleteFileFromSupabase(String imageUrl) {
        try {
            // URL format: .../public/review-images/filename
            // We split by the bucket name to get the filename
            String[] parts = imageUrl.split("/" + reviewBucket + "/");
            if (parts.length < 2) return; 
            
            String fileName = parts[1];
            String storageUrl = supabaseUrl + "/storage/v1/object/" + reviewBucket + "/" + fileName;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            restTemplate.exchange(storageUrl, HttpMethod.DELETE, requestEntity, String.class);
            
            System.out.println("Deleted review image: " + fileName);
        } catch (Exception e) {
            System.err.println("Failed to delete file from Supabase: " + e.getMessage());
        }
    }

    @Transactional
    public ReviewEntity createReview(ReviewEntity review, Long transactionId, Long reviewerId, List<MultipartFile> images) throws IOException {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));
        
        UserEntity reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found: " + reviewerId));

        UserEntity reviewedUser;
        if (transaction.getBuyer().getUserId().equals(reviewerId)) {
            reviewedUser = transaction.getSeller();
        } else if (transaction.getSeller().getUserId().equals(reviewerId)) {
            reviewedUser = transaction.getBuyer();
        } else {
            throw new IllegalStateException("Reviewer was not part of this transaction.");
        }

        review.setTransaction(transaction);
        review.setReviewer(reviewer);
        review.setReviewedUser(reviewedUser);

        // Upload and Link Images
        if (images != null && !images.isEmpty()) {
            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    String publicUrl = uploadImage(file);
                    ReviewImageEntity imageEntity = new ReviewImageEntity(publicUrl, review);
                    review.addImage(imageEntity);
                }
            }
        }
        
        return reviewRepository.save(review);
    }

    @Transactional
    public ReviewEntity updateReview(Long reviewId, Long userId, Integer rating, String comment, List<Long> imageIdsToDelete, List<MultipartFile> newImages) throws IOException {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // Security Check
        if (!review.getReviewer().getUserId().equals(userId)) {
            throw new IllegalStateException("You can only edit your own reviews.");
        }

        // 1. Update Text Fields
        if (rating != null) review.setRating(rating);
        if (comment != null) review.setComment(comment);

        // 2. Handle Deletions
        if (imageIdsToDelete != null && !imageIdsToDelete.isEmpty()) {
            // Filter images to remove
            List<ReviewImageEntity> toRemove = review.getImages().stream()
                .filter(img -> imageIdsToDelete.contains(img.getImageId()))
                .toList();

            for (ReviewImageEntity img : toRemove) {
                // Delete from Supabase
                deleteFileFromSupabase(img.getImageUrl());
                // Remove from relationship (JPA orphanRemoval will delete from DB)
                review.getImages().remove(img);
            }
        }

        // 3. Handle New Uploads
        if (newImages != null && !newImages.isEmpty()) {
            for (MultipartFile file : newImages) {
                if (!file.isEmpty()) {
                    String publicUrl = uploadImage(file);
                    ReviewImageEntity imageEntity = new ReviewImageEntity(publicUrl, review);
                    review.addImage(imageEntity);
                }
            }
        }

        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // Security Check
        if (!review.getReviewer().getUserId().equals(userId)) {
            throw new IllegalStateException("You can only delete your own reviews.");
        }

        // 1. Delete actual files from Supabase
        if (review.getImages() != null && !review.getImages().isEmpty()) {
            for (ReviewImageEntity image : review.getImages()) {
                deleteFileFromSupabase(image.getImageUrl());
            }
        }

        // 2. Delete database record (Cascade will remove ReviewImageEntity rows)
        reviewRepository.delete(review);
    }
}