package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ReviewEntity;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

    // Method to find all reviews by transaction ID
    @Query("SELECT r FROM ReviewEntity r WHERE r.transaction.transactionId = :transactionId")
    List<ReviewEntity> findAllByTransactionId(@Param("transactionId") Long transactionId);

    // Method to find a review by transaction ID and reviewer ID
    boolean existsByTransaction_TransactionIdAndReviewer_UserId(Long transactionId, Long reviewerId);

    // Methods to find reviews by reviewer ID and reviewed user ID
    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewer.userId = :reviewerId")
    List<ReviewEntity> findByReviewerId(@Param("reviewerId") Long reviewerId);

    // Methods to find reviews by reviewed user ID
    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewedUser.userId = :reviewedUserId")
    List<ReviewEntity> findByReviewedUserId(@Param("reviewedUserId") Long reviewedUserId);

    // Method to get reviews with related details for a reviewed user
    @Query("SELECT DISTINCT r FROM ReviewEntity r " + 
           "LEFT JOIN FETCH r.transaction t " +
           "LEFT JOIN FETCH t.listing l " +
           "LEFT JOIN FETCH r.reviewer " +
           "LEFT JOIN FETCH t.buyer " +
           "LEFT JOIN FETCH t.seller " +
           "WHERE r.reviewedUser.userId = :userId " +
           "ORDER BY r.createdAt DESC")
    List<ReviewEntity> findWithDetailsByReviewedUserId(@Param("userId") Long userId);

    List<ReviewEntity> findByReviewedUser_UserId(Long userId);

}
