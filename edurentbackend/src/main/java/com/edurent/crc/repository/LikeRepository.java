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
public interface LikeRepository extends JpaRepository<LikeEntity, LikeIdEntity> {

    // Methods to find likes by user ID and listing ID
    List<LikeEntity> findById_UserId(Long userId); 

    // Methods to find likes by listing ID
    List<LikeEntity> findById_ListingId(Long listingId); 

    // Method to get liked listings with details for a user
    @Query("SELECT l.listing FROM LikeEntity l " +
           "LEFT JOIN FETCH l.listing.category " +
           "LEFT JOIN FETCH l.listing.user u " +
           "LEFT JOIN FETCH u.school " +
           "LEFT JOIN FETCH l.listing.images " +
           "WHERE l.id.userId = :userId")
    List<ListingEntity> findLikedListingsByUserId(@Param("userId") Long userId);
}

