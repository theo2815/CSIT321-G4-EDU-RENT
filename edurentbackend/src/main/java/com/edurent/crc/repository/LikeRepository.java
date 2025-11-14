package com.edurent.crc.repository;

import java.util.List;
 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; 
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.LikeEntity;
import com.edurent.crc.entity.LikeIdEntity;
import com.edurent.crc.entity.ListingEntity;

@Repository
public interface LikeRepository extends JpaRepository<LikeEntity, LikeIdEntity> { // Updated
    List<LikeEntity> findById_UserId(Long userId); // Updated
    List<LikeEntity> findById_ListingId(Long listingId); // Updated

    // --- NEW METHOD ---
    // This query fetches the LikeEntity, joins and fetches the associated Listing (l),
    // and also joins and fetches the listing's category, user, school, and images,
    // all in a single database round trip.
    @Query("SELECT l.listing FROM LikeEntity l " +
           "LEFT JOIN FETCH l.listing.category " +
           "LEFT JOIN FETCH l.listing.user u " +
           "LEFT JOIN FETCH u.school " +
           "LEFT JOIN FETCH l.listing.images " +
           "WHERE l.id.userId = :userId")
    List<ListingEntity> findLikedListingsByUserId(@Param("userId") Long userId);
    // --- END NEW METHOD ---
}

