package com.edurent.crc.service;

import java.util.HashMap;
import java.util.List; // Updated
import java.util.Map;
import java.util.ArrayList;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired; // Updated
import org.springframework.messaging.simp.SimpMessagingTemplate; // Updated
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.edurent.crc.entity.ConversationEntity;
import com.edurent.crc.entity.MessageEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ConversationRepository;
import com.edurent.crc.repository.MessageRepository;
import com.edurent.crc.repository.UserRepository;
import com.edurent.crc.repository.ConversationParticipantRepository;
import com.edurent.crc.entity.ConversationParticipantEntity;

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
    private SimpMessagingTemplate messagingTemplate; 

    // [UPDATED] Added pagination logic
    public List<MessageEntity> getMessagesForConversation(Long conversationId, int page, int size) {
        // 1. Fetch newest messages first (descending order)
        Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").descending());
        Page<MessageEntity> messagePage = messageRepository.findByConversationId(conversationId, pageable);
        
        // 2. Convert to mutable list
        List<MessageEntity> messages = new ArrayList<>(messagePage.getContent());
        
        // 3. Reverse the list to chronological order (ASC) for the UI
        Collections.reverse(messages);
        
        return messages;
    }

    @Transactional
    public MessageEntity sendMessage(MessageEntity message, Long conversationId, Long senderId) {
        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
        
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found: " + senderId));

        // If User A deleted the chat, this will "undelete" it so they see the new message.
        if (conversation.getParticipants() != null) {
            for (ConversationParticipantEntity participant : conversation.getParticipants()) {
                boolean updated = false;
                
                // 1. Undelete if deleted
                if (participant.getIsDeleted()) {
                    participant.setIsDeleted(false);
                    updated = true;
                }
                
                // 2. (Optional) Unarchive if archived, so it pops to the top
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
        
        // 1. Prepare a simple DTO map to avoid infinite recursion/lazy loading issues in JSON
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

        // 3. Broadcast a notification to the RECIPIENT (to update their sidebar/unread count)
        // Find the other participant
        conversation.getParticipants().stream()
            .filter(p -> !p.getUser().getUserId().equals(senderId))
            .forEach(p -> {
                Long recipientId = p.getUser().getUserId();
                // Clients subscribed to "/topic/user.{id}" will receive this
                messagingTemplate.convertAndSend("/topic/user." + recipientId, socketResponse);
            });

        return savedMessage;
    }

    // --- NEW: Mark as Read Logic ---
    @Transactional
    public void markConversationAsRead(Long conversationId, Long currentUserId) {
        // Marks all messages in this conversation as read where the sender is NOT the current user
        messageRepository.markMessagesAsRead(conversationId, currentUserId);
    }

    // --- NEW: Mark as Unread Logic ---
    @Transactional
    public void markConversationAsUnread(Long conversationId, Long currentUserId) {
        // We only mark the *last* received message as unread to trigger the flag
        messageRepository.markLastMessageAsUnread(conversationId, currentUserId);
    }
}

