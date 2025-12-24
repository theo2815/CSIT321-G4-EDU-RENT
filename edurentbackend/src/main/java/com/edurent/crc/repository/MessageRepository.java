package com.edurent.crc.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.MessageEntity;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    // Method to find messages by conversation ID with pagination
    @Query("SELECT m FROM MessageEntity m WHERE m.conversation.conversationId = :conversationId")
    Page<MessageEntity> findByConversationId(@Param("conversationId") Long conversationId, Pageable pageable);

    @Query("SELECT m FROM MessageEntity m WHERE m.conversation.conversationId = :conversationId AND m.sentAt > :after")
    Page<MessageEntity> findByConversationIdAndSentAtAfter(@Param("conversationId") Long conversationId,
            @Param("after") LocalDateTime after, Pageable pageable);

    // Method to find messages by sender ID
    @Query("SELECT m FROM MessageEntity m WHERE m.sender.userId = :senderId")
    List<MessageEntity> findBySenderId(@Param("senderId") Long senderId);

    // Method to find the latest message in a conversation
    MessageEntity findFirstByConversation_ConversationIdOrderBySentAtDesc(Long conversationId);

    // Method to mark messages as read in a conversation for a user
    @Modifying
    @Query("UPDATE MessageEntity m SET m.isRead = true WHERE m.conversation.conversationId = :conversationId AND m.sender.userId != :userId")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // Method to mark the last message as unread in a conversation for a user
    @Modifying
    @Query("UPDATE MessageEntity m SET m.isRead = false WHERE m.messageId = (SELECT MAX(m2.messageId) FROM MessageEntity m2 WHERE m2.conversation.conversationId = :conversationId AND m2.sender.userId != :userId)")
    void markLastMessageAsUnread(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // Count unread messages from a specific sender in a conversation
    long countByConversation_ConversationIdAndSender_UserIdAndIsReadFalse(Long conversationId, Long senderId);

    // Batch fetch last message for each conversation (optimization - eliminates
    // N+1)
    @Query("""
            SELECT m FROM MessageEntity m
            WHERE m.sentAt = (
                SELECT MAX(m2.sentAt) FROM MessageEntity m2
                WHERE m2.conversation.conversationId = m.conversation.conversationId
            ) AND m.conversation.conversationId IN :conversationIds
            """)
    List<MessageEntity> findLastMessagesForConversations(@Param("conversationIds") List<Long> conversationIds);
}
