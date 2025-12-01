package com.edurent.crc.entity;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "conversations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Long conversationId;

    // --- Relationships ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_id", nullable = true)
    //@JsonIgnoreProperties("conversations")
    @JsonIgnoreProperties({"conversations", "hibernateLazyInitializer", "handler"})
    private ListingEntity listing;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference(value = "conversation-participants")
    private Set<ConversationParticipantEntity> participants;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore 
    private Set<MessageEntity> messages;

    // --- NEW: Transient fields for frontend display ---
    @Transient
    private String lastMessageContent;

    @Transient
    private LocalDateTime lastMessageTimestamp;

    @Transient
    private boolean isArchivedForCurrentUser;
    // -------------------------------------------------

    // --- NEW: Transient field for unread status ---
    @Transient
    private boolean isUnread;

    // Constructors
    public ConversationEntity() {
    }

    // Getters and Setters
    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public ListingEntity getListing() {
        return listing;
    }

    public void setListing(ListingEntity listing) {
        this.listing = listing;
    }

    public Set<ConversationParticipantEntity> getParticipants() {
        return participants;
    }

    public void setParticipants(Set<ConversationParticipantEntity> participants) {
        this.participants = participants;
    }

    public Set<MessageEntity> getMessages() {
        return messages;
    }

    public void setMessages(Set<MessageEntity> messages) {
        this.messages = messages;
    }

    // --- NEW: Getters/Setters for transient fields ---

    public boolean getIsUnread() {
        return isUnread;
    }

    public void setIsUnread(boolean isUnread) {
        this.isUnread = isUnread;
    }
    public String getLastMessageContent() {
        return lastMessageContent;
    }

    public void setLastMessageContent(String lastMessageContent) {
        this.lastMessageContent = lastMessageContent;
    }

    public LocalDateTime getLastMessageTimestamp() {
        return lastMessageTimestamp;
    }

    public void setLastMessageTimestamp(LocalDateTime lastMessageTimestamp) {
        this.lastMessageTimestamp = lastMessageTimestamp;
    }

    public boolean getIsArchivedForCurrentUser() {
        return isArchivedForCurrentUser;
    }

    public void setIsArchivedForCurrentUser(boolean isArchivedForCurrentUser) {
        this.isArchivedForCurrentUser = isArchivedForCurrentUser;
    }
    // -------------------------------------------------

    // equals, hashCode, toString (excluding relationships)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversationEntity that = (ConversationEntity) o;
        return Objects.equals(conversationId, that.conversationId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversationId);
    }

    @Override
    public String toString() {
        return "ConversationEntity{" +
                "conversationId=" + conversationId +
                '}';
    }
}

