package com.edurent.crc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ConversationEntity;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {

        // OPTIMIZED: Fetch listing and user in one query to avoid N+1
        @Query("SELECT DISTINCT c FROM ConversationEntity c " +
                        "LEFT JOIN FETCH c.listing l " +
                        "LEFT JOIN FETCH l.user " +
                        "LEFT JOIN FETCH l.category " +
                        "WHERE c.listing.listingId = :listingId")
        List<ConversationEntity> findByListingId(@Param("listingId") Long listingId);

        // Fix: Removed JOIN FETCH to avoid aggregation errors with GROUP BY
        // We only need to find if it exists. Lazy loading is acceptable for single
        // result.
        @Query("SELECT c FROM ConversationEntity c " +
                        "JOIN c.participants p " +
                        "WHERE c.listing.listingId = :listingId " +
                        "AND p.user.userId IN (:user1Id, :user2Id) " +
                        "GROUP BY c " +
                        "HAVING COUNT(DISTINCT p.user.userId) = 2")
        Optional<ConversationEntity> findExistingConversation(
                        @Param("listingId") Long listingId,
                        @Param("user1Id") Long user1Id,
                        @Param("user2Id") Long user2Id);
}