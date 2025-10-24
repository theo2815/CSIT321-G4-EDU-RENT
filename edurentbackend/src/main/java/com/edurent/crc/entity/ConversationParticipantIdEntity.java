package com.edurent.crc.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ConversationParticipantIdEntity implements Serializable { // Renamed

    private static final long serialVersionUID = 1L;

    private Long conversationId;
    private Long userId;

    // No-arg constructor (required by JPA)
    public ConversationParticipantIdEntity() {
    }

    // All-arg constructor (fixes your service error)
    public ConversationParticipantIdEntity(Long conversationId, Long userId) {
        this.conversationId = conversationId;
        this.userId = userId;
    }

    // Getters and Setters
    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversationParticipantIdEntity that = (ConversationParticipantIdEntity) o;
        return Objects.equals(conversationId, that.conversationId) &&
               Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversationId, userId);
    }
}
