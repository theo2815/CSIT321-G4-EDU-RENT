package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // <-- Import this
import org.springframework.data.jpa.repository.Query; // <-- Import this
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ConversationEntity;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {
    
    @Query("SELECT c FROM ConversationEntity c WHERE c.listing.listingId = :listingId")
    List<ConversationEntity> findByListingId(@Param("listingId") Long listingId);

    // This query checks for a conversation on a specific listing 
    // that has BOTH user1 and user2 as participants.
    @Query("SELECT c FROM ConversationEntity c " +
           "JOIN c.participants p1 " +
           "JOIN c.participants p2 " +
           "WHERE c.listing.listingId = :listingId " +
           "AND p1.user.userId = :user1Id " +
           "AND p2.user.userId = :user2Id")
    Optional<ConversationEntity> findExistingConversation(
            @Param("listingId") Long listingId, 
            @Param("user1Id") Long user1Id, 
            @Param("user2Id") Long user2Id
    );
}