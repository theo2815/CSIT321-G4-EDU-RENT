package com.edurent.crc.repository;

import com.edurent.crc.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param; // Import this
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

    @Query("SELECT r FROM ReviewEntity r WHERE r.transaction.transactionId = :transactionId")
    Optional<ReviewEntity> findByTransactionId(@Param("transactionId") Long transactionId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewer.userId = :reviewerId")
    List<ReviewEntity> findByReviewerId(@Param("reviewerId") Long reviewerId);

    @Query("SELECT r FROM ReviewEntity r WHERE r.reviewedUser.userId = :reviewedUserId")
    List<ReviewEntity> findByReviewedUserId(@Param("reviewedUserId") Long reviewedUserId);
}
