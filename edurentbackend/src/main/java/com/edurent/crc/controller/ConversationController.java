package com.edurent.crc.controller;

import com.edurent.crc.entity.ConversationEntity; // Updated
import com.edurent.crc.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@CrossOrigin(origins = "*")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @GetMapping("/user/{userId}")
    public List<ConversationEntity> getConversationsForUser(@PathVariable Long userId) { // Updated
        return conversationService.getConversationsForUser(userId);
    }

    @PostMapping
    public ResponseEntity<ConversationEntity> startConversation(@RequestParam Long listingId, // Updated
                                                          @RequestParam Long starterId,
                                                          @RequestParam Long receiverId) {
        try {
            ConversationEntity newConversation = conversationService.startConversation(listingId, starterId, receiverId); // Updated
            return new ResponseEntity<>(newConversation, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

