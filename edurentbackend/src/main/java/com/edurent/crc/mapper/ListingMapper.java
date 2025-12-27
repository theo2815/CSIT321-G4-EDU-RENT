package com.edurent.crc.mapper;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.edurent.crc.dto.CategoryDTO;
import com.edurent.crc.dto.ListingDTO;
import com.edurent.crc.dto.ListingImageDTO;
import com.edurent.crc.dto.UserDTO;
import com.edurent.crc.entity.CategoryEntity;
import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.ListingImageEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.dto.TransactionDTO;

/**
 * Mapper component for converting between Entity and DTO objects.
 * This helps prevent N+1 issues and keeps entity details from leaking to API
 * responses.
 */
@Component
public class ListingMapper {

    /**
     * Converts a ListingEntity to a ListingDTO.
     */
    public ListingDTO toDTO(ListingEntity entity) {
        if (entity == null) {
            return null;
        }

        ListingDTO dto = new ListingDTO();
        dto.setListingId(entity.getListingId());
        dto.setPublicId(entity.getPublicId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setCondition(entity.getCondition());
        dto.setListingType(entity.getListingType());
        dto.setPrice(entity.getPrice());
        dto.setRentPeriod(entity.getRentPeriod());
        dto.setStatus(entity.getStatus());
        dto.setAllowMeetup(entity.getAllowMeetup());
        dto.setMeetupLocation(entity.getMeetupLocation());
        dto.setAllowDelivery(entity.getAllowDelivery());
        dto.setDeliveryOptions(entity.getDeliveryOptions());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        // Map User
        if (entity.getUser() != null) {
            dto.setUser(toUserDTO(entity.getUser()));
        }

        // Map Category
        if (entity.getCategory() != null) {
            dto.setCategory(toCategoryDTO(entity.getCategory()));
        }

        // Map Images
        if (entity.getImages() != null && !entity.getImages().isEmpty()) {
            dto.setImages(toImageDTOList(entity.getImages()));
        } else {
            dto.setImages(Collections.emptyList());
        }

        // Map Transactions
        if (entity.getTransactions() != null && !entity.getTransactions().isEmpty()) {
            dto.setTransactions(toTransactionDTOList(entity.getTransactions()));
        } else {
            dto.setTransactions(Collections.emptyList());
        }

        return dto;
    }

    /**
     * Converts a Page of ListingEntity to a Page of ListingDTO.
     */
    public Page<ListingDTO> toDTOPage(Page<ListingEntity> entityPage) {
        return entityPage.map(this::toDTO);
    }

    /**
     * Converts a List of ListingEntity to a List of ListingDTO.
     */
    public List<ListingDTO> toDTOList(List<ListingEntity> entities) {
        if (entities == null) {
            return Collections.emptyList();
        }
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Converts a UserEntity to a UserDTO (lightweight version for embedding).
     */
    public UserDTO toUserDTO(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        UserDTO dto = new UserDTO();
        dto.setUserId(entity.getUserId());
        dto.setFullName(entity.getFullName());
        dto.setProfilePictureUrl(entity.getProfilePictureUrl());
        dto.setProfileSlug(entity.getProfileSlug());
        dto.setBio(entity.getBio());
        dto.setFacebookUrl(entity.getFacebookUrl());
        dto.setInstagramUrl(entity.getInstagramUrl());
        dto.setAddress(entity.getAddress());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setEmail(entity.getEmail());
        dto.setPhoneNumber(entity.getPhoneNumber());
        if (entity.getSchool() != null) {
            dto.setSchoolName(entity.getSchool().getName());
            dto.setSchool(new UserDTO.SchoolInfo(entity.getSchool().getName()));
        }
        return dto;
    }

    /**
     * Converts a CategoryEntity to a CategoryDTO.
     */
    public CategoryDTO toCategoryDTO(CategoryEntity entity) {
        if (entity == null) {
            return null;
        }
        CategoryDTO dto = new CategoryDTO();
        dto.setCategoryId(entity.getCategoryId());
        dto.setCategoryName(entity.getName());
        dto.setDescription(entity.getDescription());
        return dto;
    }

    /**
     * Converts a Set of ListingImageEntity to a List of ListingImageDTO.
     */
    public List<ListingImageDTO> toImageDTOList(Set<ListingImageEntity> entities) {
        if (entities == null) {
            return Collections.emptyList();
        }
        return entities.stream()
                .map(this::toImageDTO)
                .collect(Collectors.toList());
    }

    /**
     * Converts a ListingImageEntity to a ListingImageDTO.
     */
    public ListingImageDTO toImageDTO(ListingImageEntity entity) {
        if (entity == null) {
            return null;
        }
        return new ListingImageDTO(
                entity.getImageId(),
                entity.getImageUrl(),
                entity.isCoverPhoto());
    }

    /**
     * Converts a List of TransactionEntity to a List of TransactionDTO.
     */
    public List<TransactionDTO> toTransactionDTOList(List<TransactionEntity> entities) {
        if (entities == null) {
            return Collections.emptyList();
        }
        return entities.stream()
                .map(this::toTransactionDTO)
                .collect(Collectors.toList());
    }

    /**
     * Converts a TransactionEntity to a TransactionDTO.
     */
    public TransactionDTO toTransactionDTO(TransactionEntity entity) {
        if (entity == null) {
            return null;
        }
        return new TransactionDTO(
                entity.getTransactionId(),
                entity.getTransactionType(),
                entity.getStatus(),
                entity.getStartDate(),
                entity.getEndDate());
    }
}
