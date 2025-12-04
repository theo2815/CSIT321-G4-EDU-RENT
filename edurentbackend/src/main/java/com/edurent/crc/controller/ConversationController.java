package com.edurent.crc.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.edurent.crc.dto.ConversationDTO;
import com.edurent.crc.dto.ListingDTO;
import com.edurent.crc.dto.UserDTO;
import com.edurent.crc.entity.ConversationEntity;
import com.edurent.crc.entity.MessageEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ReviewRepository;
import com.edurent.crc.repository.TransactionRepository;
import com.edurent.crc.service.ConversationService;
import com.edurent.crc.service.MessageImageService;
import com.edurent.crc.service.MessageService;

@RestController
@RequestMapping("/api/v1/conversations")
// @CrossOrigin(origins = "*")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private MessageImageService messageImageService;

    @Autowired 
    private TransactionRepository transactionRepository;

    @Autowired 
    private ReviewRepository reviewRepository;

    // --- 1. Get User's Conversations (DTO) ---
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationDTO>> getConversationsForUser(@PathVariable Long userId) {
        List<ConversationEntity> entities = conversationService.getConversationsForUser(userId);
        
        List<ConversationDTO> dtos = entities.stream().map(entity -> {
            ConversationDTO dto = new ConversationDTO();
            dto.setConversationId(entity.getConversationId());
            dto.setLastMessageContent(entity.getLastMessageContent());
            dto.setLastMessageTimestamp(entity.getLastMessageTimestamp());
            dto.setIsUnread(entity.getIsUnread());
            
            if (entity.getListing() != null) {
                ListingDTO listingDto = new ListingDTO();
                listingDto.setListingId(entity.getListing().getListingId());
                listingDto.setTitle(entity.getListing().getTitle());
                listingDto.setPrice(entity.getListing().getPrice());
                
                if (entity.getListing().getImages() != null && !entity.getListing().getImages().isEmpty()) {
                    listingDto.setImageUrl(entity.getListing().getImages().iterator().next().getImageUrl());
                }
                
                if (entity.getListing().getUser() != null) {
                     UserDTO ownerDto = new UserDTO(
                         entity.getListing().getUser().getUserId(),
                         entity.getListing().getUser().getFullName(),
                         entity.getListing().getUser().getProfilePictureUrl()
                     );
                     listingDto.setOwner(ownerDto);
                }
                dto.setListing(listingDto);

                Optional<TransactionEntity> transaction = transactionRepository.findByListingId(entity.getListing().getListingId());
                
                if (transaction.isPresent()) {
                    TransactionEntity t = transaction.get();
                    
                    Set<Long> chatParticipantIds = entity.getParticipants().stream()
                        .map(p -> p.getUser().getUserId())
                        .collect(Collectors.toSet());

                    boolean isCorrectChat = chatParticipantIds.contains(t.getBuyer().getUserId()) 
                                         && chatParticipantIds.contains(t.getSeller().getUserId());
                    
                    if (isCorrectChat) {
                        dto.setTransactionId(t.getTransactionId());
                        boolean hasReviewed = reviewRepository.existsByTransaction_TransactionIdAndReviewer_UserId(t.getTransactionId(), userId);
                        dto.setHasReviewed(hasReviewed);
                    }
                }
            }
            
            List<UserDTO> participants = entity.getParticipants().stream().map(p -> 
                new UserDTO(p.getUser().getUserId(), p.getUser().getFullName(), p.getUser().getProfilePictureUrl())
            ).collect(Collectors.toList());
            dto.setParticipants(participants);
            
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // --- 2. Start Conversation ---
    @PostMapping
    public ResponseEntity<ConversationEntity> startConversation(
            @RequestParam Long listingId,
            @RequestParam Long starterId,
            @RequestParam Long receiverId) {
        try {
            ConversationEntity newConversation = conversationService.startConversation(listingId, starterId, receiverId);
            return new ResponseEntity<>(newConversation, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // --- 3. Updated: Get Messages (With Pagination) ---
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageEntity>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication // Inject Authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        // Pass userId to service
        List<MessageEntity> messages = messageService.getMessagesForConversation(conversationId, currentUser.getUserId(), page, size);
        return ResponseEntity.ok(messages);
    }

    // --- 4. NEW: Send Message ---
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<MessageEntity> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody MessageEntity message,
            Authentication authentication) {
        
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            MessageEntity sentMessage = messageService.sendMessage(message, conversationId, currentUser.getUserId());
            return new ResponseEntity<>(sentMessage, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // --- 5. Soft Delete Endpoint ---
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            conversationService.deleteConversationForUser(conversationId, currentUser.getUserId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- 6. Archive Endpoint ---
    @PutMapping("/{conversationId}/archive")
    public ResponseEntity<Void> archiveConversation(
            @PathVariable Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            conversationService.toggleArchiveConversationForUser(conversationId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- NEW 7. Mark as Read Endpoint ---
    @PutMapping("/{conversationId}/read")
    public ResponseEntity<Void> markConversationAsRead(
            @PathVariable Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            messageService.markConversationAsRead(conversationId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- 8. NEW: Mark as Unread Endpoint ---
    @PutMapping("/{conversationId}/unread")
    public ResponseEntity<Void> markConversationAsUnread(
            @PathVariable Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            messageService.markConversationAsUnread(conversationId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- 9. NEW: Endpoint to upload an image for a conversation
    @PostMapping("/{conversationId}/messages/upload-image")
    public ResponseEntity<Map<String, String>> uploadMessageImage(
            @PathVariable Long conversationId,
            @RequestParam("image") MultipartFile image
    ) {
        try {
            System.out.println("✅ CONTROLLER REACHED: Uploading image for conversation " + conversationId);
            String imageUrl = messageImageService.uploadImage(image);
            return ResponseEntity.ok(Collections.singletonMap("url", imageUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

