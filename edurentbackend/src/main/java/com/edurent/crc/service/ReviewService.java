package com.edurent.crc.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.entity.ReviewEntity;
import com.edurent.crc.entity.ReviewImageEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.NotificationRepository;
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

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CloudinaryService cloudinaryService;

    public List<ReviewEntity> getReviewsForUser(Long userId) {
        return reviewRepository.findWithDetailsByReviewedUserId(userId);
    }

    public Optional<ReviewEntity> getReviewByTransactionId(Long transactionId) {
        List<ReviewEntity> reviews = reviewRepository.findAllByTransactionId(transactionId);
        return reviews.stream().findFirst();
    }

    // [NEW] Paginated Buyer Reviews
    public Page<ReviewEntity> getBuyerReviews(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepository.findReviewsFromBuyers(userId, pageable);
    }

    // [NEW] Paginated Seller Reviews
    public Page<ReviewEntity> getSellerReviews(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepository.findReviewsFromSellers(userId, pageable);
    }

    @Transactional
    public ReviewEntity createReview(ReviewEntity review, Long transactionId, Long reviewerId,
            List<MultipartFile> images) throws IOException {
        if (transactionId == null || reviewerId == null) {
            throw new IllegalArgumentException("Transaction ID and Reviewer ID must not be null");
        }
        boolean exists = reviewRepository.existsByTransaction_TransactionIdAndReviewer_UserId(transactionId,
                reviewerId);
        if (exists) {
            throw new IllegalStateException("You have already reviewed this transaction.");
        }

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
                    String publicUrl = cloudinaryService.uploadImage(file, "reviews");
                    ReviewImageEntity imageEntity = new ReviewImageEntity(publicUrl, review);
                    review.addImage(imageEntity);
                }
            }
        }

        ReviewEntity savedReview = reviewRepository.save(review);
        sendReviewNotification(savedReview, false);
        return savedReview;
    }

    @Transactional
    public ReviewEntity updateReview(Long reviewId, Long userId, Integer rating, String comment,
            List<Long> imageIdsToDelete, List<MultipartFile> newImages) throws IOException {
        if (reviewId == null)
            throw new IllegalArgumentException("Review ID must not be null");
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // Security Check
        if (!review.getReviewer().getUserId().equals(userId)) {
            throw new IllegalStateException("You can only edit your own reviews.");
        }

        // 1. Update Text Fields
        if (rating != null)
            review.setRating(rating);
        if (comment != null)
            review.setComment(comment);

        // 2. Handle Deletions
        if (imageIdsToDelete != null && !imageIdsToDelete.isEmpty()) {
            // Filter images to remove
            List<ReviewImageEntity> toRemove = review.getImages().stream()
                    .filter(img -> imageIdsToDelete.contains(img.getImageId()))
                    .toList();

            for (ReviewImageEntity img : toRemove) {
                // Delete from Cloudinary
                cloudinaryService.deleteImage(img.getImageUrl());
                // Remove from relationship (JPA orphanRemoval will delete from DB)
                review.getImages().remove(img);
            }
        }

        // 3. Handle New Uploads
        if (newImages != null && !newImages.isEmpty()) {
            for (MultipartFile file : newImages) {
                if (!file.isEmpty()) {
                    String publicUrl = cloudinaryService.uploadImage(file, "reviews");
                    ReviewImageEntity imageEntity = new ReviewImageEntity(publicUrl, review);
                    review.addImage(imageEntity);
                }
            }
        }

        ReviewEntity savedReview = reviewRepository.save(review);
        sendReviewNotification(savedReview, true);
        return savedReview;
    }

    // Helper to send/update notification with Stock-Up Logic
    private void sendReviewNotification(ReviewEntity review, boolean isEdit) {
        try {
            UserEntity recipient = review.getReviewedUser();
            UserEntity reviewer = review.getReviewer();
            String listingTitle = review.getTransaction().getListing().getTitle();
            Long listingId = review.getTransaction().getListing().getListingId();

            // Unique Link for this product context (used for grouping)
            // Points to recipient's profile, Reviews tab, with a reference to the item
            String linkUrl = String.format("/profile/%d?tab=reviews&ref=%d", recipient.getUserId(), listingId);

            String content;
            if (isEdit) {
                content = String.format(
                        "<strong>%s</strong> edited a review about <strong>%s</strong>. Check it under the Review tab!",
                        reviewer.getFullName(), listingTitle);
            } else {
                content = String.format("<strong>%s</strong> reviewed you about <strong>%s</strong>",
                        reviewer.getFullName(), listingTitle);
            }

            // Stock-Up Logic: Check for existing notification for this specific link
            NotificationEntity notification = notificationRepository
                    .findFirstByTypeAndUser_UserIdAndLinkUrlOrderByCreatedAtDesc("NEW_REVIEW", recipient.getUserId(),
                            linkUrl)
                    .orElse(new NotificationEntity());

            if (notification.getNotificationId() == null) {
                notification.setUser(recipient);
                notification.setType("NEW_REVIEW");
                notification.setLinkUrl(linkUrl);
            }

            notification.setContent(content);
            notification.setCreatedAt(LocalDateTime.now()); // Bump to top
            notification.setIsRead(false); // Mark as unread

            NotificationEntity savedNotif = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/user." + recipient.getUserId(), savedNotif);

        } catch (Exception e) {
            System.err.println("Failed to send review notification: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        if (reviewId == null)
            throw new IllegalArgumentException("Review ID must not be null");
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // Security Check
        if (!review.getReviewer().getUserId().equals(userId)) {
            throw new IllegalStateException("You can only delete your own reviews.");
        }

        // --- NEW: Send "Deleted" Notification before deletion ---
        sendDeleteReviewNotification(review);

        // 1. Delete actual files from Supabase
        if (review.getImages() != null && !review.getImages().isEmpty()) {
            for (ReviewImageEntity image : review.getImages()) {
                cloudinaryService.deleteImage(image.getImageUrl());
            }
        }

        // 2. Delete database record (Cascade will remove ReviewImageEntity rows)
        reviewRepository.delete(review);
    }

    private void sendDeleteReviewNotification(ReviewEntity review) {
        try {
            UserEntity recipient = review.getReviewedUser();
            UserEntity reviewer = review.getReviewer();
            String listingTitle = review.getTransaction().getListing().getTitle();

            // Link to the profile (reviews tab) generally, as the specific review is gone
            String linkUrl = String.format("/profile/%d?tab=reviews", recipient.getUserId());

            NotificationEntity notification = new NotificationEntity();
            notification.setUser(recipient);
            notification.setType("REVIEW_DELETED");
            notification.setLinkUrl(linkUrl);

            String content = String.format("<strong>%s</strong> deleted a review about <strong>%s</strong>",
                    reviewer.getFullName(), listingTitle);
            notification.setContent(content);
            notification.setCreatedAt(LocalDateTime.now());

            NotificationEntity savedNotif = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/user." + recipient.getUserId(), savedNotif);
        } catch (Exception e) {
            System.err.println("Failed to send delete review notification: " + e.getMessage());
        }
    }
}