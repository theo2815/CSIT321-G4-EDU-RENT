package com.edurent.crc.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edurent.crc.entity.ConversationEntity;
import com.edurent.crc.entity.ConversationParticipantEntity;
import com.edurent.crc.entity.ConversationParticipantIdEntity;
import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.MessageEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ConversationParticipantRepository;
import com.edurent.crc.repository.ConversationRepository;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.MessageRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private ConversationParticipantRepository participantRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private MessageRepository messageRepository;

    // 1. Get Conversations for User
    public List<ConversationEntity> getConversationsForUser(Long userId) {
        List<ConversationParticipantEntity> participants = participantRepository.findById_UserIdAndIsDeletedFalse(userId);

        List<ConversationEntity> conversations = new ArrayList<>();

        for (ConversationParticipantEntity p : participants) {
            ConversationEntity conv = p.getConversation();

            // A. Populate Last Message Details
            MessageEntity lastMsg = messageRepository.findFirstByConversation_ConversationIdOrderBySentAtDesc(conv.getConversationId());
            if (lastMsg != null) {
                conv.setLastMessageContent(lastMsg.getContent());
                conv.setLastMessageTimestamp(lastMsg.getSentAt());

                boolean isUnread = !Boolean.TRUE.equals(lastMsg.getRead()) 
                                   && !lastMsg.getSender().getUserId().equals(userId);
                conv.setIsUnread(isUnread);
            }

            // B. Populate Archived Status (For the frontend filter)
            conv.setIsArchivedForCurrentUser(p.getIsArchived());

            conversations.add(conv);
        }

        return conversations;
    }
    

    // 2. Start Conversation
    @Transactional
    public ConversationEntity startConversation(Long listingId, Long starterId, Long receiverId) {
        // 1. Check if conversation already exists
        Optional<ConversationEntity> existing = conversationRepository.findExistingConversation(listingId, starterId, receiverId);
        
        if (existing.isPresent()) {
            return existing.get(); // Return existing conversation
        }

        // 2. If not, create new one
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));
        
        UserEntity starter = userRepository.findById(starterId)
                .orElseThrow(() -> new RuntimeException("Starter user not found: " + starterId));
        
        UserEntity receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver user not found: " + receiverId));

        ConversationEntity conversation = new ConversationEntity();
        conversation.setListing(listing);
        ConversationEntity savedConversation = conversationRepository.save(conversation);

        // 3. Add Participants
        ConversationParticipantIdEntity starterIdObj = new ConversationParticipantIdEntity(savedConversation.getConversationId(), starter.getUserId());
        ConversationParticipantEntity starterParticipant = new ConversationParticipantEntity(starterIdObj, savedConversation, starter);
        participantRepository.save(starterParticipant);

        ConversationParticipantIdEntity receiverIdObj = new ConversationParticipantIdEntity(savedConversation.getConversationId(), receiver.getUserId());
        ConversationParticipantEntity receiverParticipant = new ConversationParticipantEntity(receiverIdObj, savedConversation, receiver);
        participantRepository.save(receiverParticipant);

        return conversationRepository.findById(savedConversation.getConversationId())
                .orElse(savedConversation);
    }

    // 3. Delete Conversation for User (Soft Delete)
    @Transactional
    public void deleteConversationForUser(Long conversationId, Long userId) {
        ConversationParticipantIdEntity id = new ConversationParticipantIdEntity(conversationId, userId);
        ConversationParticipantEntity participant = participantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Participant record not found"));
        
        participant.setIsDeleted(true); // Soft delete
        participantRepository.save(participant);
    }


    // 4. Toggle Archive Conversation for User
    @Transactional
    public void toggleArchiveConversationForUser(Long conversationId, Long userId) {
        ConversationParticipantIdEntity id = new ConversationParticipantIdEntity(conversationId, userId);
        ConversationParticipantEntity participant = participantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Participant record not found"));
        
        participant.setIsArchived(!participant.getIsArchived());
        participantRepository.save(participant);
    }
}

