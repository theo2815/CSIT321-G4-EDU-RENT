package com.edurent.crc.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "conversation_participants")
public class ConversationParticipantEntity {

    @EmbeddedId
    private ConversationParticipantIdEntity id = new ConversationParticipantIdEntity(); // Updated

    // --- Relationships ---
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("conversationId")
    @JoinColumn(name = "conversation_id")
    @JsonBackReference(value = "conversation-participants")
    private ConversationEntity conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"conversationParticipants", "messagesSent", "listings", "transactionsAsBuyer", "transactionsAsSeller", "reviewsGiven", "reviewsReceived", "likes", "notifications", "School", "hibernateLazyInitializer", "handler"})
    private UserEntity user;

    // FLAGS
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "is_archived", nullable = false)
    private boolean isArchived = false;

    // --- NEW FIELD: Tracks when the user deleted the chat to hide history ---
    @Column(name = "last_deleted_at")
    private LocalDateTime lastDeletedAt;

    // Constructors
    public ConversationParticipantEntity() {
    }
    
    // All-arg constructor 
    public ConversationParticipantEntity(ConversationParticipantIdEntity id, ConversationEntity conversation, UserEntity user) {
        this.id = id;
        this.conversation = conversation;
        this.user = user;
    }

    // Getters and Setters 
    public ConversationParticipantIdEntity getId() {
        return id;
    }

    public void setId(ConversationParticipantIdEntity id) {
        this.id = id;
    }

    public ConversationEntity getConversation() {
        return conversation;
    }

    public void setConversation(ConversationEntity conversation) {
        this.conversation = conversation;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    // --- NEW Getters and Setters ---
    public boolean getIsDeleted() { 
        return isDeleted; 
    }

    public void setIsDeleted(boolean isDeleted) { 
        this.isDeleted = isDeleted; 
    }

    public boolean getIsArchived() { 
        return isArchived; 
    }
    public void setIsArchived(boolean isArchived) { 
        this.isArchived = isArchived; 
    }

    public LocalDateTime getLastDeletedAt() { 
        return lastDeletedAt; 
    }

    public void setLastDeletedAt(LocalDateTime lastDeletedAt) { 
        this.lastDeletedAt = lastDeletedAt; 
    }

    // -------------------------------

    // equals, hashCode, toString (use id)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversationParticipantEntity that = (ConversationParticipantEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ConversationParticipantEntity{" +
                "id=" + id +
                '}';
    }
}

