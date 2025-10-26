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
    Optional<ReviewEntity> findByTransactionId(@Param("transactionId") Long transactionId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewer.userId = :reviewerId")
    List<ReviewEntity> findByReviewerId(@Param("reviewerId") Long reviewerId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewedUser.userId = :reviewedUserId")
    List<ReviewEntity> findByReviewedUserId(@Param("reviewedUserId") Long reviewedUserId);

    List<ReviewEntity> findByReviewedUser_UserId(Long userId);
}
