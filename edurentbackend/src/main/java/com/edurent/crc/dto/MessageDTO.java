package com.edurent.crc.dto;

import java.time.LocalDateTime;

public class MessageDTO {
    private Long messageId;
    private String content;
    private LocalDateTime sentAt;
    private Boolean isRead;
    private String attachmentUrl;
    private UserDTO sender;
    private Long conversationId;

    public MessageDTO() {
    }

    public MessageDTO(Long messageId, String content, LocalDateTime sentAt, Boolean isRead, String attachmentUrl,
            UserDTO sender, Long conversationId) {
        this.messageId = messageId;
        this.content = content;
        this.sentAt = sentAt;
        this.isRead = isRead;
        this.attachmentUrl = attachmentUrl;
        this.sender = sender;
        this.conversationId = conversationId;
    }

    // Getters and Setters
    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public UserDTO getSender() {
        return sender;
    }

    public void setSender(UserDTO sender) {
        this.sender = sender;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }
}
