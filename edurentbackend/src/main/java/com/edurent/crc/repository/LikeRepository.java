package com.edurent.crc.repository;

import com.edurent.crc.entity.LikeEntity; // Updated
import com.edurent.crc.entity.LikeIdEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LikeRepository extends JpaRepository<LikeEntity, LikeIdEntity> { // Updated
    List<LikeEntity> findById_UserId(Long userId); // Updated
    List<LikeEntity> findById_ListingId(Long listingId); // Updated
}

