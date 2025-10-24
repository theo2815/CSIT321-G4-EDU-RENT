package com.edurent.crc.service;

import com.edurent.crc.entity.ConversationEntity; // Updated
import com.edurent.crc.entity.MessageEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.ConversationRepository;
import com.edurent.crc.repository.MessageRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<MessageEntity> getMessagesForConversation(Long conversationId) { // Updated
        return messageRepository.findByConversationId(conversationId);
    }

    public MessageEntity sendMessage(MessageEntity message, Long conversationId, Long senderId) { // Updated
        ConversationEntity conversation = conversationRepository.findById(conversationId) // Updated
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
        
        UserEntity sender = userRepository.findById(senderId) // Updated
                .orElseThrow(() -> new RuntimeException("Sender not found: " + senderId));
        
        // TODO: Check if sender is a participant in the conversation

        message.setConversation(conversation);
        message.setSender(sender);
        
        return messageRepository.save(message);
    }
}

