package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // Import this
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ReviewEntity;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

    @Query("SELECT r FROM ReviewEntity r WHERE r.transaction.transactionId = :transactionId")
    List<ReviewEntity> findAllByTransactionId(@Param("transactionId") Long transactionId);

    boolean existsByTransaction_TransactionIdAndReviewer_UserId(Long transactionId, Long reviewerId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewer.userId = :reviewerId")
    List<ReviewEntity> findByReviewerId(@Param("reviewerId") Long reviewerId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewedUser.userId = :reviewedUserId")
    List<ReviewEntity> findByReviewedUserId(@Param("reviewedUserId") Long reviewedUserId);

    @Query("SELECT DISTINCT r FROM ReviewEntity r " + 
           "LEFT JOIN FETCH r.transaction t " +
           "LEFT JOIN FETCH t.listing l " +
           "LEFT JOIN FETCH l.images " +
           "LEFT JOIN FETCH r.reviewer " +
           "LEFT JOIN FETCH t.buyer " +
           "LEFT JOIN FETCH t.seller " +
           "LEFT JOIN FETCH r.images " + 
           "WHERE r.reviewedUser.userId = :userId " +
           "ORDER BY r.createdAt DESC")
    List<ReviewEntity> findWithDetailsByReviewedUserId(@Param("userId") Long userId);

    List<ReviewEntity> findByReviewedUser_UserId(Long userId);

}
