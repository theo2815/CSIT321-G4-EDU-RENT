package com.edurent.crc.service;

import com.edurent.crc.entity.ConversationEntity; // Updated
import com.edurent.crc.entity.ConversationParticipantEntity; // Updated
import com.edurent.crc.entity.ConversationParticipantIdEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.ConversationParticipantRepository;
import com.edurent.crc.repository.ConversationRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ConversationParticipantService {

    @Autowired
    private ConversationParticipantRepository participantRepository;

    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<ConversationParticipantEntity> getParticipants(Long conversationId) { // Updated
        return participantRepository.findById_ConversationId(conversationId);
    }
    
    public ConversationParticipantEntity addParticipant(Long conversationId, Long userId) { // Updated
        ConversationEntity conversation = conversationRepository.findById(conversationId) // Updated
            .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
        UserEntity user = userRepository.findById(userId) // Updated
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
            
        ConversationParticipantIdEntity id = new ConversationParticipantIdEntity(conversationId, userId);
        if(participantRepository.existsById(id)) {
            throw new IllegalStateException("User is already a participant.");
        }
        
        ConversationParticipantEntity participant = new ConversationParticipantEntity(id, conversation, user); // Updated
        return participantRepository.save(participant);
    }
}

