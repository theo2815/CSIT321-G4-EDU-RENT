package com.edurent.crc.service;

import com.edurent.crc.entity.*;
import com.edurent.crc.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

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

    public List<ConversationEntity> getConversationsForUser(Long userId) {
        // This line is now fixed because getConversation() exists
        return participantRepository.findById_UserId(userId).stream()
                .map(ConversationParticipantEntity::getConversation)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConversationEntity startConversation(Long listingId, Long starterId, Long receiverId) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));
        
        UserEntity starter = userRepository.findById(starterId)
                .orElseThrow(() -> new RuntimeException("Starter user not found: " + starterId));
        
        UserEntity receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver user not found: " + receiverId));

        ConversationEntity conversation = new ConversationEntity();
        conversation.setListing(listing);
        ConversationEntity savedConversation = conversationRepository.save(conversation);

        // This line is now fixed: uses ConversationParticipantIdEntity and its all-arg constructor
        ConversationParticipantIdEntity starterParticipantId = new ConversationParticipantIdEntity(savedConversation.getConversationId(), starter.getUserId());
        ConversationParticipantEntity starterParticipant = new ConversationParticipantEntity(starterParticipantId, savedConversation, starter);
        participantRepository.save(starterParticipant);

        // This line is now fixed: uses ConversationParticipantIdEntity and its all-arg constructor
        ConversationParticipantIdEntity receiverParticipantId = new ConversationParticipantIdEntity(savedConversation.getConversationId(), receiver.getUserId());
        ConversationParticipantEntity receiverParticipant = new ConversationParticipantEntity(receiverParticipantId, savedConversation, receiver);
        participantRepository.save(receiverParticipant);

        return savedConversation;
    }
}

