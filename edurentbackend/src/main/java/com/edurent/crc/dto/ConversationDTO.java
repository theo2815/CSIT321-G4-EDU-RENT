package com.edurent.crc.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ConversationDTO {
    private Long conversationId;
    private ListingDTO listing;
    private List<UserDTO> participants;
    private String lastMessageContent;
    private LocalDateTime lastMessageTimestamp;
    private boolean isUnread;

    // Constructors, Getters, Setters
    public ConversationDTO() {}
    
    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    
    public ListingDTO getListing() { return listing; }
    public void setListing(ListingDTO listing) { this.listing = listing; }
    
    public List<UserDTO> getParticipants() { return participants; }
    public void setParticipants(List<UserDTO> participants) { this.participants = participants; }
    
    public String getLastMessageContent() { return lastMessageContent; }
    public void setLastMessageContent(String lastMessageContent) { this.lastMessageContent = lastMessageContent; }
    
    public LocalDateTime getLastMessageTimestamp() { return lastMessageTimestamp; }
    public void setLastMessageTimestamp(LocalDateTime lastMessageTimestamp) { this.lastMessageTimestamp = lastMessageTimestamp; }

    public boolean getIsUnread() { return isUnread; }
    public void setIsUnread(boolean isUnread) { this.isUnread = isUnread; }
}