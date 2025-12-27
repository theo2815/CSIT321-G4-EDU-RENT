package com.edurent.crc.mapper;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Page;

import com.edurent.crc.dto.ConversationDTO;
import com.edurent.crc.dto.MessageDTO;
import com.edurent.crc.dto.UserDTO;
import com.edurent.crc.entity.ConversationEntity;
import com.edurent.crc.entity.MessageEntity;

@Component
public class ConversationMapper {

    @Autowired
    private ListingMapper listingMapper;

    public ConversationDTO toDTO(ConversationEntity entity) {
        if (entity == null) {
            return null;
        }

        ConversationDTO dto = new ConversationDTO();
        dto.setConversationId(entity.getConversationId());

        if (entity.getListing() != null) {
            dto.setListing(listingMapper.toDTO(entity.getListing()));
        }

        if (entity.getParticipants() != null) {
            List<UserDTO> participantDTOs = entity.getParticipants().stream()
                    .map(p -> listingMapper.toUserDTO(p.getUser()))
                    .collect(Collectors.toList());
            dto.setParticipants(participantDTOs);
        }

        // Transaction ID is handled manually in service/controller logic as Entity
        // lacks direct relationship

        // Note: lastMessageContent, lastMessageTimestamp, isUnread, hasReviewed
        // are often set dynamically in the Service/Controller, but we map base fields
        // here.

        return dto;
    }

    public List<ConversationDTO> toDTOList(List<ConversationEntity> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public MessageDTO toMessageDTO(MessageEntity entity) {
        if (entity == null)
            return null;

        MessageDTO dto = new MessageDTO();
        dto.setMessageId(entity.getMessageId());
        dto.setContent(entity.getContent());
        dto.setSentAt(entity.getSentAt());
        dto.setIsRead(entity.getRead());
        dto.setAttachmentUrl(entity.getAttachmentUrl());

        if (entity.getSender() != null) {
            dto.setSender(listingMapper.toUserDTO(entity.getSender()));
        }

        if (entity.getConversation() != null) {
            dto.setConversationId(entity.getConversation().getConversationId());
        }

        return dto;
    }

    public Page<MessageDTO> toMessageDTOPage(Page<MessageEntity> messagePage) {
        return messagePage.map(this::toMessageDTO);
    }

    public List<MessageDTO> toMessageDTOList(List<MessageEntity> entities) {
        if (entities == null)
            return Collections.emptyList();
        return entities.stream().map(this::toMessageDTO).collect(Collectors.toList());
    }
}
