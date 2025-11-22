package com.edurent.crc.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.MessageEntity;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    @Query("SELECT m FROM MessageEntity m WHERE m.conversation.conversationId = :conversationId ORDER BY m.sentAt ASC")
    List<MessageEntity> findByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM MessageEntity m WHERE m.sender.userId = :senderId")
    List<MessageEntity> findBySenderId(@Param("senderId") Long senderId);

    MessageEntity findFirstByConversation_ConversationIdOrderBySentAtDesc(Long conversationId);

    // --- NEW: Mark messages as read ---
    @Modifying
    @Query("UPDATE MessageEntity m SET m.isRead = true WHERE m.conversation.conversationId = :conversationId AND m.sender.userId != :userId")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // --- NEW: Mark messages as UNREAD ---
    // This marks the *latest* message received by the user as unread to trigger the indicator
    @Modifying
    @Query("UPDATE MessageEntity m SET m.isRead = false WHERE m.messageId = (SELECT MAX(m2.messageId) FROM MessageEntity m2 WHERE m2.conversation.conversationId = :conversationId AND m2.sender.userId != :userId)")
    void markLastMessageAsUnread(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
