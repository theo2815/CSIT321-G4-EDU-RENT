package com.edurent.crc.service;

import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edurent.crc.entity.ConversationEntity;

import com.edurent.crc.entity.ConversationParticipantEntity;
import com.edurent.crc.entity.ConversationParticipantIdEntity;

import com.edurent.crc.entity.MessageEntity;
import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ConversationParticipantRepository;
import com.edurent.crc.repository.ConversationRepository;

import com.edurent.crc.repository.MessageRepository;
import com.edurent.crc.repository.NotificationRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationParticipantRepository participantRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 1. Get Messages (Updated to filter by deletion history)
    public List<MessageEntity> getMessagesForConversation(@NonNull Long conversationId, @NonNull Long userId, int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").descending());

        // Find the participant info to check if they cleared history
        ConversationParticipantIdEntity partId = new ConversationParticipantIdEntity(conversationId, userId);
        ConversationParticipantEntity participant = participantRepository.findById(partId).orElse(null);

        Page<MessageEntity> messagePage;

        if (participant != null && participant.getLastDeletedAt() != null) {
            // Only fetch messages sent AFTER the deletion timestamp
            messagePage = messageRepository.findByConversationIdAndSentAtAfter(
                    conversationId,
                    participant.getLastDeletedAt(),
                    pageable);
        } else {
            // Fetch full history
            messagePage = messageRepository.findByConversationId(conversationId, pageable);
        }

        List<MessageEntity> messages = new ArrayList<>(messagePage.getContent());
        Collections.reverse(messages);
        return messages;
    }

    // 2. Send Message with Real-Time Broadcasting
    @Transactional
    public MessageEntity sendMessage(MessageEntity message, @NonNull Long conversationId, @NonNull Long senderId) {
        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));

        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found: " + senderId));

        // If User A deleted the chat, this will "undelete" it so they see the new
        // message.
        if (conversation.getParticipants() != null) {
            for (ConversationParticipantEntity participant : conversation.getParticipants()) {
                boolean updated = false;

                // 1. Undelete if deleted
                if (participant.getIsDeleted()) {
                    participant.setIsDeleted(false);
                    updated = true;
                }

                if (participant.getIsArchived()) {
                    participant.setIsArchived(false);
                    updated = true;
                }

                if (updated) {
                    participantRepository.save(participant);
                }
            }
        }

        message.setConversation(conversation);
        message.setSender(sender);

        MessageEntity savedMessage = messageRepository.save(message);

        // --- REAL-TIME BROADCAST ---

        // 1. Prepare a simple DTO map to avoid infinite recursion/lazy loading issues
        // in JSON
        Map<String, Object> socketResponse = new HashMap<>();
        socketResponse.put("id", savedMessage.getMessageId());
        socketResponse.put("senderId", sender.getUserId());
        socketResponse.put("text", savedMessage.getContent());
        socketResponse.put("timestamp", savedMessage.getSentAt().toString());
        socketResponse.put("conversationId", conversationId);
        socketResponse.put("attachmentUrl", savedMessage.getAttachmentUrl());

        // 2. Broadcast to the specific conversation topic (for the open chat window)
        // Clients subscribed to "/topic/conversation.{id}" will receive this
        messagingTemplate.convertAndSend("/topic/conversation." + conversationId, socketResponse);

        // 3. Broadcast a notification to the RECIPIENT (to update their sidebar/unread
        // count)
        // Find the other participant
        conversation.getParticipants().stream()
                .filter(p -> !p.getUser().getUserId().equals(senderId))
                .forEach(p -> {
                    Long recipientId = p.getUser().getUserId();

                    String linkUrl = "/messages/" + conversationId;
                    String productName = conversation.getListing() != null ? conversation.getListing().getTitle()
                            : "Item";

                    // Find the latest notification for this conversation (Read OR Unread) to avoid
                    // duplicates
                    NotificationEntity notification = notificationRepository
                            .findFirstByTypeAndUser_UserIdAndLinkUrlOrderByCreatedAtDesc("NEW_MESSAGE", recipientId,
                                    linkUrl)
                            .orElse(new NotificationEntity());

                    // If new (ID is null), set basic fields
                    if (notification.getNotificationId() == null) {
                        notification.setUser(p.getUser());
                        notification.setType("NEW_MESSAGE");
                        notification.setLinkUrl(linkUrl);
                    }

                    // Calculate Unread Count
                    long unreadCount = messageRepository
                            .countByConversation_ConversationIdAndSender_UserIdAndIsReadFalse(
                                    conversationId, senderId);

                    // Construct Content based on count
                    String content;
                    if (unreadCount > 1) {
                        content = String.format("<strong>%s</strong> sent %d new messages about <strong>%s</strong>",
                                sender.getFullName(), unreadCount, productName);
                    } else {
                        content = String.format("<strong>%s</strong> messaged you about <strong>%s</strong>",
                                sender.getFullName(), productName);
                    }

                    notification.setContent(content);
                    notification.setCreatedAt(LocalDateTime.now()); // Bump timestamp to top
                    notification.setIsRead(false); // Mark as unread again (resurrect if it was read)

                    NotificationEntity savedNotification = notificationRepository.save(notification);

                    // Add notification fields to socket payload
                    socketResponse.put("type", "NEW_MESSAGE");
                    socketResponse.put("notificationId", savedNotification.getNotificationId());
                    socketResponse.put("notificationContent", content);
                    socketResponse.put("linkUrl", savedNotification.getLinkUrl());
                    socketResponse.put("isRead", false);
                    socketResponse.put("createdAt", savedNotification.getCreatedAt().toString());

                    // Clients subscribed to "/topic/user.{id}" will receive this
                    messagingTemplate.convertAndSend("/topic/user." + recipientId, socketResponse);
                });

        return savedMessage;
    }

    // 3. Mark Conversation as Read
    @Transactional
    public void markConversationAsRead(@NonNull Long conversationId, @NonNull Long currentUserId) {
        messageRepository.markMessagesAsRead(conversationId, currentUserId);
    }

    // 4. Mark Conversation as Unread
    @Transactional
    public void markConversationAsUnread(@NonNull Long conversationId, @NonNull Long currentUserId) {
        messageRepository.markLastMessageAsUnread(conversationId, currentUserId);
    }
}
