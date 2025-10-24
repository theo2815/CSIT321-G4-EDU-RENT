package com.edurent.crc.repository;

import com.edurent.crc.entity.ListingImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param; // Import this
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImageEntity, Long> {

    @Query("SELECT li FROM ListingImageEntity li WHERE li.listing.listingId = :listingId")
    List<ListingImageEntity> findByListingId(@Param("listingId") Long listingId);
}
