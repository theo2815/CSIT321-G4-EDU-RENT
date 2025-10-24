package com.edurent.crc.entity;

import jakarta.persistence.*;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonBackReference;

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
    @JsonBackReference(value = "user-participants")
    private UserEntity user;

    // Constructors
    public ConversationParticipantEntity() {
    }
    
    // All-arg constructor (for ConversationParticipantService)
    public ConversationParticipantEntity(ConversationParticipantIdEntity id, ConversationEntity conversation, UserEntity user) {
        this.id = id;
        this.conversation = conversation;
        this.user = user;
    }

    // Getters and Setters (Fixes ConversationService error)
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

