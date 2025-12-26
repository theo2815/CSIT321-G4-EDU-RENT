package com.edurent.crc.service;

import org.springframework.lang.NonNull;
import java.util.Objects;

import java.time.LocalDateTime;
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

    // 1. Get Conversations for User (Optimized with batch queries)
    public List<ConversationEntity> getConversationsForUser(@NonNull Long userId, int page, int size, String filter) {
        List<ConversationParticipantEntity> participants = participantRepository
                .findById_UserIdAndIsDeletedFalse(userId);

        if (participants.isEmpty()) {
            return new ArrayList<>();
        }

        // Collect all conversation IDs for batch processing
        List<Long> conversationIds = participants.stream()
                .map(p -> p.getConversation().getConversationId())
                .toList();

        // Batch fetch all last messages at once (replaces N queries with 1)
        List<MessageEntity> lastMessages = messageRepository.findLastMessagesForConversations(conversationIds);
        java.util.Map<Long, MessageEntity> lastMessageMap = lastMessages.stream()
                .collect(java.util.stream.Collectors.toMap(
                        msg -> msg.getConversation().getConversationId(),
                        msg -> msg,
                        (a, b) -> a.getSentAt().isAfter(b.getSentAt()) ? a : b));

        List<ConversationEntity> conversations = new ArrayList<>();

        for (ConversationParticipantEntity p : participants) {
            ConversationEntity conv = p.getConversation();

            // A. Use batch-fetched last message instead of individual query
            MessageEntity lastMsg = lastMessageMap.get(conv.getConversationId());
            if (lastMsg != null) {
                if (p.getLastDeletedAt() == null || lastMsg.getSentAt().isAfter(p.getLastDeletedAt())) {
                    conv.setLastMessageContent(lastMsg.getContent());
                    conv.setLastMessageTimestamp(lastMsg.getSentAt());

                    boolean isUnread = !Boolean.TRUE.equals(lastMsg.getRead())
                            && !lastMsg.getSender().getUserId().equals(userId);
                    conv.setIsUnread(isUnread);
                } else {
                    // Chat exists but history is cleared and no new messages
                    conv.setLastMessageContent("Chat cleared");
                    conv.setLastMessageTimestamp(p.getLastDeletedAt());
                    conv.setIsUnread(false);
                }
            } else {
                // Should not usually happen if chat exists, but handle it
                conv.setLastMessageTimestamp(conv.getListing().getCreatedAt()); // Fallback
            }

            // B. Populate Archived Status (For the frontend filter - backend filtering
            // happens next)
            conv.setIsArchivedForCurrentUser(p.getIsArchived());

            // --- FILTERING LOGIC ---
            boolean match = false;

            // "Selling": User is the owner of the listing
            boolean isSeller = conv.getListing().getUser().getUserId().equals(userId);

            // Check if listing is sold (status = "Sold" or "Rented")
            String listingStatus = conv.getListing().getStatus();
            boolean isSold = "Sold".equalsIgnoreCase(listingStatus) || "Rented".equalsIgnoreCase(listingStatus);

            switch (filter) {
                case "Selling":
                    // Active selling conversations (not sold, not archived)
                    if (isSeller && !isSold && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "Buying":
                    // Active buying conversations (not sold, not archived)
                    if (!isSeller && !isSold && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "Unread":
                    // Unread conversations (not archived, any sold status)
                    if (conv.getIsUnread() && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "Sold":
                    // Conversations for sold/rented items (not archived)
                    if (isSold && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "Archived":
                    if (conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "All":
                    // All conversations regardless of sold status (not archived)
                    // Used by Product Detail Modal to find existing chats
                    if (!conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "All Messages":
                default:
                    // All active conversations (not sold, not archived)
                    if (!isSold && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
            }

            if (match) {
                conversations.add(conv);
            }
        }

        // C. Sort by Last Message Timestamp (Descending)
        conversations.sort((a, b) -> {
            LocalDateTime dateA = a.getLastMessageTimestamp() != null ? a.getLastMessageTimestamp() : LocalDateTime.MIN;
            LocalDateTime dateB = b.getLastMessageTimestamp() != null ? b.getLastMessageTimestamp() : LocalDateTime.MIN;
            return dateB.compareTo(dateA);
        });

        // D. Manual Pagination (Slice the list)
        int start = Math.min(page * size, conversations.size());
        int end = Math.min(start + size, conversations.size());

        if (start >= conversations.size()) {
            return new ArrayList<>();
        }

        return conversations.subList(start, end);
    }

    // 2. Start Conversation
    @Transactional
    public ConversationEntity startConversation(@NonNull Long listingId, @NonNull Long starterId,
            @NonNull Long receiverId) {
        // 1. Check if conversation already exists
        Optional<ConversationEntity> existing = conversationRepository.findExistingConversation(listingId, starterId,
                receiverId);

        if (existing.isPresent()) {
            ConversationEntity conv = existing.get();
            ConversationParticipantIdEntity partId = new ConversationParticipantIdEntity(conv.getConversationId(),
                    starterId);
            participantRepository.findById(partId).ifPresent(p -> {
                if (p.getIsDeleted()) {
                    p.setIsDeleted(false);
                    participantRepository.save(p);
                }
            });
            return conv;
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
        ConversationParticipantIdEntity starterIdObj = new ConversationParticipantIdEntity(
                savedConversation.getConversationId(), starter.getUserId());
        ConversationParticipantEntity starterParticipant = new ConversationParticipantEntity(starterIdObj,
                savedConversation, starter);
        participantRepository.save(starterParticipant);

        ConversationParticipantIdEntity receiverIdObj = new ConversationParticipantIdEntity(
                savedConversation.getConversationId(), receiver.getUserId());
        ConversationParticipantEntity receiverParticipant = new ConversationParticipantEntity(receiverIdObj,
                savedConversation, receiver);
        participantRepository.save(receiverParticipant);

        return conversationRepository.findById(Objects.requireNonNull(savedConversation.getConversationId()))
                .orElse(savedConversation);
    }

    // 3. Delete Conversation for User (Soft Delete)
    @Transactional
    public void deleteConversationForUser(@NonNull Long conversationId, @NonNull Long userId) {
        ConversationParticipantIdEntity id = new ConversationParticipantIdEntity(conversationId, userId);
        ConversationParticipantEntity participant = participantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Participant record not found"));

        // 1. Soft delete for this user
        participant.setIsDeleted(true);
        participant.setLastDeletedAt(LocalDateTime.now()); // Mark the timeline
        participantRepository.save(participant);

        // 2. Check if ALL participants have deleted the chat
        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        boolean allParticipantsDeleted = true;
        for (ConversationParticipantEntity p : conversation.getParticipants()) {
            if (p.getId().equals(id))
                continue;

            if (!p.getIsDeleted()) {
                allParticipantsDeleted = false;
                break;
            }
        }

        // 3. If everyone deleted it, hard delete from database
        if (allParticipantsDeleted) {
            System.out.println("All participants deleted conversation " + conversationId + ". Performing hard delete.");
            conversationRepository.delete(Objects.requireNonNull(conversation));
        }
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
