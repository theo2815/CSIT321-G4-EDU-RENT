package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // <-- Import this
import org.springframework.data.jpa.repository.Query; // <-- Import this
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ListingEntity;

@Repository
public interface ListingRepository extends JpaRepository<ListingEntity, Long> {

    @Query("SELECT l FROM ListingEntity l WHERE l.user.userId = :userId")
    List<ListingEntity> findByUserId(@Param("userId") Long userId);

    @Query("SELECT l FROM ListingEntity l WHERE l.category.categoryId = :categoryId")
    List<ListingEntity> findByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT l FROM ListingEntity l LEFT JOIN FETCH l.user u WHERE l.listingId = :listingId")
    Optional<ListingEntity> findByIdWithUser(@Param("listingId") Long listingId);

    List<ListingEntity> findByUser_UserId(Long userId);
    List<ListingEntity> findByListingType(String listingType);
    List<ListingEntity> findByStatus(String status);
    List<ListingEntity> findByCategory_CategoryIdAndStatus(Long categoryId, String status);



}