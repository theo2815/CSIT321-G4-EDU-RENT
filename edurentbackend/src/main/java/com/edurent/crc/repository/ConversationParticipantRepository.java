package com.edurent.crc.repository;

import java.util.List; // Updated

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.ConversationParticipantEntity;
import com.edurent.crc.entity.ConversationParticipantIdEntity;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipantEntity, ConversationParticipantIdEntity> { // Updated
    List<ConversationParticipantEntity> findById_UserIdAndIsDeletedFalse(Long userId);
    List<ConversationParticipantEntity> findById_ConversationId(Long conversationId); // Updated
}

