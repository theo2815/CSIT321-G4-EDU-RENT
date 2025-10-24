package com.edurent.crc.repository;

import com.edurent.crc.entity.ConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // <-- Import this
import org.springframework.data.repository.query.Param; // <-- Import this
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {
    
    @Query("SELECT c FROM ConversationEntity c WHERE c.listing.listingId = :listingId")
    List<ConversationEntity> findByListingId(@Param("listingId") Long listingId);
}