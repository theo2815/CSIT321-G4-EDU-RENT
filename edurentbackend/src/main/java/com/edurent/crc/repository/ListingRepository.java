package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page; 
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ListingEntity;

@Repository
public interface ListingRepository extends JpaRepository<ListingEntity, Long> {

    // Method to find listings by user ID
    @Query("SELECT l FROM ListingEntity l WHERE l.user.userId = :userId")
    Page<ListingEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);
    // Method to find listings by category ID
    @Query("SELECT l FROM ListingEntity l WHERE l.category.categoryId = :categoryId")
    Page<ListingEntity> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);
    // Method to find listing by ID with user details
    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user u WHERE l.listingId = :listingId")
    Optional<ListingEntity> findByIdWithUser(@Param("listingId") Long listingId);

    // Additional query methods
    Page<ListingEntity> findByUser_UserId(Long userId, Pageable pageable);

    Page<ListingEntity> findByUser_UserIdAndStatusIn(Long userId, List<String> statuses, Pageable pageable);

    Page<ListingEntity> findByListingTypeAndStatusIn(String listingType, List<String> statuses, Pageable pageable);
    
    List<ListingEntity> findByListingType(String listingType);
    List<ListingEntity> findByStatus(String status);
    List<ListingEntity> findByCategory_CategoryIdAndStatus(Long categoryId, String status);

    Page<ListingEntity> findByStatusIn(List<String> statuses, Pageable pageable);
    Page<ListingEntity> findByCategory_CategoryIdAndStatusIn(Long categoryId, List<String> statuses, Pageable pageable);

}