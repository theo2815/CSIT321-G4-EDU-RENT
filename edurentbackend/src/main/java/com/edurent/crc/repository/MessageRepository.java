package com.edurent.crc.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param; // Import this
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.MessageEntity;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    @Query("SELECT m FROM MessageEntity m WHERE m.conversation.conversationId = :conversationId ORDER BY m.sentAt ASC")
    List<MessageEntity> findByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM MessageEntity m WHERE m.sender.userId = :senderId")
    List<MessageEntity> findBySenderId(@Param("senderId") Long senderId);

    MessageEntity findFirstByConversation_ConversationIdOrderBySentAtDesc(Long conversationId);
}
