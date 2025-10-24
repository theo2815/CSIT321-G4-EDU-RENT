package com.edurent.crc.repository;

import com.edurent.crc.entity.ListingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // <-- Import this
import org.springframework.data.repository.query.Param; // <-- Import this
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<ListingEntity, Long> {

    @Query("SELECT l FROM ListingEntity l WHERE l.user.userId = :userId")
    List<ListingEntity> findByUserId(@Param("userId") Long userId);

    @Query("SELECT l FROM ListingEntity l WHERE l.category.categoryId = :categoryId")
    List<ListingEntity> findByCategoryId(@Param("categoryId") Long categoryId);

    // These methods are correct and do not need to change.
    List<ListingEntity> findByListingType(String listingType);
    List<ListingEntity> findByStatus(String status);
}