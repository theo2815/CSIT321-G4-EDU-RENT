package com.edurent.crc.controller;

import com.edurent.crc.entity.ConversationParticipantEntity; // Updated
import com.edurent.crc.service.ConversationParticipantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations/{conversationId}/participants")
@CrossOrigin(origins = "*")
public class ConversationParticipantController {

    @Autowired
    private ConversationParticipantService participantService;

    @GetMapping
    public List<ConversationParticipantEntity> getParticipants(@PathVariable Long conversationId) { // Updated
        return participantService.getParticipants(conversationId);
    }

    @PostMapping
    public ResponseEntity<ConversationParticipantEntity> addParticipant(@PathVariable Long conversationId, // Updated
                                                                  @RequestParam Long userId) {
        try {
            ConversationParticipantEntity newParticipant = participantService.addParticipant(conversationId, userId); // Updated
            return new ResponseEntity<>(newParticipant, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

