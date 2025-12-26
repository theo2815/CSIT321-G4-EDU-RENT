package com.edurent.crc.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ConversationParticipantEntity;
import com.edurent.crc.entity.ConversationParticipantIdEntity;

@Repository
public interface ConversationParticipantRepository
        extends JpaRepository<ConversationParticipantEntity, ConversationParticipantIdEntity> { // Updated
    @org.springframework.data.jpa.repository.Query("SELECT p FROM ConversationParticipantEntity p " +
            "LEFT JOIN FETCH p.conversation c " +
            "LEFT JOIN FETCH c.listing l " +
            "LEFT JOIN FETCH l.user " +
            "WHERE p.id.userId = :userId AND p.isDeleted = false")
    List<ConversationParticipantEntity> findById_UserIdAndIsDeletedFalse(
            @org.springframework.data.repository.query.Param("userId") Long userId);

    List<ConversationParticipantEntity> findById_ConversationId(Long conversationId);
}
