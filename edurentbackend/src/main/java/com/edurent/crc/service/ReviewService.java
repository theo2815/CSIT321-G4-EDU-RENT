package com.edurent.crc.service;

import java.util.List; // Updated
import java.util.Optional; // Updated

import org.springframework.beans.factory.annotation.Autowired; // Updated
import org.springframework.stereotype.Service;

import com.edurent.crc.entity.ReviewEntity;
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

    public Optional<ReviewEntity> getReviewByTransactionId(Long transactionId) { // Updated
        return reviewRepository.findByTransactionId(transactionId);
    }
    
    public List<ReviewEntity> getReviewsForUser(Long userId) {
        return reviewRepository.findByReviewedUser_UserId(userId);
    }

    public ReviewEntity createReview(ReviewEntity review, Long transactionId, Long reviewerId) { // Updated
        TransactionEntity transaction = transactionRepository.findById(transactionId) // Updated
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));
        
        UserEntity reviewer = userRepository.findById(reviewerId) // Updated
                .orElseThrow(() -> new RuntimeException("Reviewer not found: " + reviewerId));

        UserEntity reviewedUser; // Updated
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
        
        return reviewRepository.save(review);
    }
}

