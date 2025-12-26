package com.edurent.crc.controller;

import org.springframework.lang.NonNull;
import java.util.Objects;

import java.util.Collections;
import java.util.List;
import java.util.Map;
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

    // --- 1. Get User's Conversations (DTO) - Optimized with batch queries ---
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationDTO>> getConversationsForUser(
            @PathVariable @NonNull Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "All") String filter) {
        List<ConversationEntity> entities = conversationService.getConversationsForUser(userId, page, size, filter);

        if (entities.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Batch collect all listing IDs for transaction lookup
        List<Long> listingIds = entities.stream()
                .filter(e -> e.getListing() != null)
                .map(e -> e.getListing().getListingId())
                .distinct()
                .toList();

        // Batch fetch all transactions at once (replaces N queries with 1)
        Map<Long, TransactionEntity> txMap = listingIds.isEmpty() ? Collections.emptyMap()
                : transactionRepository.findLatestByListingIds(listingIds).stream()
                        .collect(Collectors.toMap(
                                t -> t.getListing().getListingId(),
                                t -> t,
                                (a, b) -> a.getTransactionId() > b.getTransactionId() ? a : b));

        // Collect all transaction IDs for review batch lookup
        List<Long> transactionIds = txMap.values().stream()
                .map(TransactionEntity::getTransactionId)
                .toList();

        // Batch fetch reviewed transaction IDs (replaces N queries with 1)
        Set<Long> reviewedTxIds = transactionIds.isEmpty() ? Collections.emptySet()
                : new java.util.HashSet<>(reviewRepository.findReviewedTransactionIds(userId, transactionIds));

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
                            entity.getListing().getUser().getProfilePictureUrl());
                    ownerDto.setProfileSlug(entity.getListing().getUser().getProfileSlug());
                    listingDto.setOwner(ownerDto);
                }
                dto.setListing(listingDto);

                // Use batch-fetched transaction instead of individual query
                TransactionEntity transaction = txMap.get(entity.getListing().getListingId());
                if (transaction != null) {
                    Set<Long> chatParticipantIds = entity.getParticipants().stream()
                            .map(p -> p.getUser().getUserId())
                            .collect(Collectors.toSet());

                    boolean isCorrectChat = chatParticipantIds.contains(transaction.getBuyer().getUserId())
                            && chatParticipantIds.contains(transaction.getSeller().getUserId());

                    if (isCorrectChat) {
                        dto.setTransactionId(transaction.getTransactionId());
                        // Use batch-fetched review status instead of individual query
                        dto.setHasReviewed(reviewedTxIds.contains(transaction.getTransactionId()));
                    }
                }
            }

            List<UserDTO> participants = entity.getParticipants().stream().map(p -> {
                UserDTO u = new UserDTO(p.getUser().getUserId(), p.getUser().getFullName(),
                        p.getUser().getProfilePictureUrl());
                u.setSchoolName(p.getUser().getSchool() != null ? p.getUser().getSchool().getName() : "N/A");
                u.setProfileSlug(p.getUser().getProfileSlug());
                return u;
            }).collect(Collectors.toList());

            dto.setParticipants(participants);

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // --- 2. Start Conversation ---
    @PostMapping
    public ResponseEntity<ConversationEntity> startConversation(
            @RequestParam @NonNull Long listingId,
            @RequestParam @NonNull Long starterId,
            @RequestParam @NonNull Long receiverId) {
        try {
            ConversationEntity newConversation = conversationService.startConversation(listingId, starterId,
                    receiverId);
            return new ResponseEntity<>(newConversation, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // --- 3. Updated: Get Messages (With Pagination) ---
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageEntity>> getMessages(
            @PathVariable @NonNull Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication // Inject Authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        // Pass userId to service
        List<MessageEntity> messages = messageService.getMessagesForConversation(conversationId,
                Objects.requireNonNull(currentUser.getUserId()), page, size);
        return ResponseEntity.ok(messages);
    }

    // --- 4. NEW: Send Message ---
    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<MessageEntity> sendMessage(
            @PathVariable @NonNull Long conversationId,
            @RequestBody MessageEntity message,
            Authentication authentication) {

        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            MessageEntity sentMessage = messageService.sendMessage(message, conversationId,
                    Objects.requireNonNull(currentUser.getUserId()));
            return new ResponseEntity<>(sentMessage, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // --- 5. Soft Delete Endpoint ---
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable @NonNull Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            conversationService.deleteConversationForUser(conversationId,
                    Objects.requireNonNull(currentUser.getUserId()));
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- 6. Archive Endpoint ---
    @PutMapping("/{conversationId}/archive")
    public ResponseEntity<Void> archiveConversation(
            @PathVariable @NonNull Long conversationId,
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
            @PathVariable @NonNull Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            messageService.markConversationAsRead(conversationId, Objects.requireNonNull(currentUser.getUserId()));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- 8. NEW: Mark as Unread Endpoint ---
    @PutMapping("/{conversationId}/unread")
    public ResponseEntity<Void> markConversationAsUnread(
            @PathVariable @NonNull Long conversationId,
            Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            messageService.markConversationAsUnread(conversationId, Objects.requireNonNull(currentUser.getUserId()));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- 9. NEW: Endpoint to upload an image for a conversation
    @PostMapping("/{conversationId}/messages/upload-image")
    public ResponseEntity<Map<String, String>> uploadMessageImage(
            @PathVariable @NonNull Long conversationId,
            @RequestParam("image") MultipartFile image,
            Authentication authentication) {
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
