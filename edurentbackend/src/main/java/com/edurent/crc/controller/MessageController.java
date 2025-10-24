package com.edurent.crc.controller;

import com.edurent.crc.entity.MessageEntity; // Updated
import com.edurent.crc.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations/{conversationId}/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @GetMapping
    public List<MessageEntity> getMessages(@PathVariable Long conversationId) { // Updated
        return messageService.getMessagesForConversation(conversationId);
    }

    @PostMapping
    public ResponseEntity<MessageEntity> sendMessage(@RequestBody MessageEntity message, // Updated
                                               @PathVariable Long conversationId,
                                               @RequestParam Long senderId) {
        try {
            MessageEntity newMessage = messageService.sendMessage(message, conversationId, senderId); // Updated
            return new ResponseEntity<>(newMessage, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

