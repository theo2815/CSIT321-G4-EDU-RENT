package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ListingEntity;

@Repository
public interface ListingRepository extends JpaRepository<ListingEntity, Long> {

        // --- Pageable queries with EntityGraph for list views ---
        // Note: Using @EntityGraph with Pageable works well for smaller datasets.
        // The original JPQL with DISTINCT is preserved for complex filtering.

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.user.userId = :userId")
        Page<ListingEntity> findByUserId(@Param("userId") Long userId, Pageable pageable);

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.user.userId = :userId AND l.status IN :statuses")
        Page<ListingEntity> findByUser_UserIdAndStatusIn(@Param("userId") Long userId,
                        @Param("statuses") List<String> statuses, Pageable pageable);

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.user.userId = :userId AND l.listingType = :listingType AND l.status IN :statuses")
        Page<ListingEntity> findByUser_UserIdAndListingTypeAndStatusIn(@Param("userId") Long userId,
                        @Param("listingType") String listingType,
                        @Param("statuses") List<String> statuses, Pageable pageable);

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.category.categoryId = :categoryId")
        Page<ListingEntity> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.category.categoryId = :categoryId AND l.status IN :statuses")
        Page<ListingEntity> findByCategory_CategoryIdAndStatusIn(@Param("categoryId") Long categoryId,
                        @Param("statuses") List<String> statuses, Pageable pageable);

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.status IN :statuses")
        Page<ListingEntity> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);

        @EntityGraph(value = "Listing.withUserAndCategory")
        @Query("SELECT l FROM ListingEntity l WHERE l.listingType = :listingType AND l.status IN :statuses")
        Page<ListingEntity> findByListingTypeAndStatusIn(@Param("listingType") String listingType,
                        @Param("statuses") List<String> statuses, Pageable pageable);

        // --- Detail queries with full EntityGraph (includes images) ---

        /**
         * Find listing by ID with all details (user, category, images).
         * Uses @EntityGraph instead of JOIN FETCH for cleaner code.
         */
        @EntityGraph(value = "Listing.withDetails")
        Optional<ListingEntity> findByListingId(Long listingId);

        /**
         * Find listing by public ID with all details (user, category, images).
         * Uses @EntityGraph instead of JOIN FETCH for cleaner code.
         */
        @EntityGraph(value = "Listing.withDetails")
        Optional<ListingEntity> findByPublicId(String publicId);

        // --- Simple queries without eager loading (for internal use) ---
        List<ListingEntity> findByListingType(String listingType);

        List<ListingEntity> findByStatus(String status);

        List<ListingEntity> findByCategory_CategoryIdAndStatus(Long categoryId, String status);
}
