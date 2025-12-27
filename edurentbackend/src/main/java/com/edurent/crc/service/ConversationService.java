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
    public List<ConversationEntity> getConversationsForUser(@NonNull Long userId, int page, int size, String filter,
            Long listingId) {
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

            // New: Filter by Listing ID if provided
            if (listingId != null && !conv.getListing().getListingId().equals(listingId)) {
                continue;
            }

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
                case "Purchased":
                    // Completed purchases: user is buyer AND item is sold/rented (not archived)
                    if (!isSeller && isSold && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "Unread":
                    // Unread conversations (not archived, any sold status)
                    if (conv.getIsUnread() && !conv.getIsArchivedForCurrentUser())
                        match = true;
                    break;
                case "Sold":
                case "My Sales":
                    // Completed sales: user is seller AND item is sold/rented (not archived)
                    if (isSeller && isSold && !conv.getIsArchivedForCurrentUser())
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
                    // All conversations including sold (not archived) - FIX: Now includes sold
                    // items
                    if (!conv.getIsArchivedForCurrentUser())
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

    // 1.5 Get Unread Counts Per Filter (for tab badges)
    public java.util.Map<String, Integer> getUnreadCountsPerFilter(@NonNull Long userId) {
        List<ConversationParticipantEntity> participants = participantRepository
                .findById_UserIdAndIsDeletedFalse(userId);

        if (participants.isEmpty()) {
            return java.util.Map.of(
                    "All Messages", 0, "Selling", 0, "Buying", 0,
                    "Purchased", 0, "Sold", 0, "Unread", 0, "Archived", 0);
        }

        // Collect conversation IDs for batch processing
        List<Long> conversationIds = participants.stream()
                .map(p -> p.getConversation().getConversationId())
                .toList();

        // Batch fetch all last messages
        List<MessageEntity> lastMessages = messageRepository.findLastMessagesForConversations(conversationIds);
        java.util.Map<Long, MessageEntity> lastMessageMap = lastMessages.stream()
                .collect(java.util.stream.Collectors.toMap(
                        msg -> msg.getConversation().getConversationId(),
                        msg -> msg,
                        (a, b) -> a.getSentAt().isAfter(b.getSentAt()) ? a : b));

        // Initialize counters
        int allMessages = 0, selling = 0, buying = 0, purchased = 0, sold = 0, unread = 0, archived = 0;

        for (ConversationParticipantEntity p : participants) {
            ConversationEntity conv = p.getConversation();

            // Get unread status
            MessageEntity lastMsg = lastMessageMap.get(conv.getConversationId());
            boolean isUnread = false;
            if (lastMsg != null) {
                if (p.getLastDeletedAt() == null || lastMsg.getSentAt().isAfter(p.getLastDeletedAt())) {
                    isUnread = !Boolean.TRUE.equals(lastMsg.getRead())
                            && !lastMsg.getSender().getUserId().equals(userId);
                }
            }

            if (!isUnread)
                continue; // Only count unread conversations

            boolean isArchivedForUser = p.getIsArchived();
            boolean isSeller = conv.getListing().getUser().getUserId().equals(userId);
            String listingStatus = conv.getListing().getStatus();
            boolean isSold = "Sold".equalsIgnoreCase(listingStatus) || "Rented".equalsIgnoreCase(listingStatus);

            // Count by filter category
            if (isArchivedForUser) {
                archived++;
            } else {
                // All non-archived unread messages go into All Messages
                allMessages++;
                unread++; // Unread tab

                if (isSeller) {
                    if (isSold) {
                        sold++; // My Sales
                    } else {
                        selling++; // Active selling
                    }
                } else {
                    if (isSold) {
                        purchased++; // Completed purchases
                    } else {
                        buying++; // Active buying
                    }
                }
            }
        }

        java.util.Map<String, Integer> result = new java.util.HashMap<>();
        result.put("All Messages", allMessages);
        result.put("Selling", selling);
        result.put("Buying", buying);
        result.put("Purchased", purchased);
        result.put("Sold", sold);
        result.put("Unread", unread);
        result.put("Archived", archived);
        return result;
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

        // FIX: Manually add participants to the entity before returning
        // This avoids lazy loading issues where participants are not fetched
        java.util.Set<ConversationParticipantEntity> participants = new java.util.HashSet<>();
        participants.add(starterParticipant);
        participants.add(receiverParticipant);
        savedConversation.setParticipants(participants);

        return savedConversation;
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
