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

    // OPTIMIZATION: Fetch Category and User eagerly
    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.category LEFT JOIN FETCH l.user WHERE l.user.userId = :userId")
    Page<ListingEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user LEFT JOIN FETCH l.category WHERE l.user.userId = :userId AND l.status IN :statuses")
    Page<ListingEntity> findByUser_UserIdAndStatusIn(@Param("userId") Long userId,
            @Param("statuses") List<String> statuses, Pageable pageable);

    // Method to find listings by category ID
    // OPTIMIZATION: Left Join Fetch User and Category
    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user LEFT JOIN FETCH l.category WHERE l.category.categoryId = :categoryId")
    Page<ListingEntity> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user LEFT JOIN FETCH l.category WHERE l.category.categoryId = :categoryId AND l.status IN :statuses")
    Page<ListingEntity> findByCategory_CategoryIdAndStatusIn(@Param("categoryId") Long categoryId,
            @Param("statuses") List<String> statuses, Pageable pageable);

    // Method to find listing by ID with user details and images
    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user LEFT JOIN FETCH l.category LEFT JOIN FETCH l.images WHERE l.listingId = :listingId")
    Optional<ListingEntity> findByIdWithUser(@Param("listingId") Long listingId);

    // General find by status with eager load
    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user LEFT JOIN FETCH l.category WHERE l.status IN :statuses")
    Page<ListingEntity> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);

    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user LEFT JOIN FETCH l.category WHERE l.listingType = :listingType AND l.status IN :statuses")
    Page<ListingEntity> findByListingTypeAndStatusIn(@Param("listingType") String listingType,
            @Param("statuses") List<String> statuses, Pageable pageable);

    // Additional query methods
    Page<ListingEntity> findByUser_UserId(Long userId, Pageable pageable);

    List<ListingEntity> findByListingType(String listingType);

    List<ListingEntity> findByStatus(String status);

    List<ListingEntity> findByCategory_CategoryIdAndStatus(Long categoryId, String status);

}