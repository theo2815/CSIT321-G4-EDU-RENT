package com.edurent.crc.repository;

import com.edurent.crc.entity.ConversationParticipantEntity; // Updated
import com.edurent.crc.entity.ConversationParticipantIdEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipantEntity, ConversationParticipantIdEntity> { // Updated
    List<ConversationParticipantEntity> findById_UserId(Long userId); // Updated
    List<ConversationParticipantEntity> findById_ConversationId(Long conversationId); // Updated
}

