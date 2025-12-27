package com.edurent.crc.mapper;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.data.domain.Page;

import com.edurent.crc.dto.ListingDTO;
import com.edurent.crc.dto.ReviewDTO;
import com.edurent.crc.dto.ReviewImageDTO;
import com.edurent.crc.dto.UserDTO;
import com.edurent.crc.entity.ListingImageEntity;
import com.edurent.crc.entity.ReviewEntity;
import com.edurent.crc.entity.TransactionEntity;

@Component
public class ReviewMapper {

    public ReviewDTO toDTO(ReviewEntity review) {
        if (review == null)
            return null;

        ReviewDTO dto = new ReviewDTO();
        dto.setId(review.getReviewId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());

        // --- Map Images ---
        if (review.getImages() != null) {
            Set<Long> seenIds = new HashSet<>();
            dto.setReviewImages(review.getImages().stream()
                    .filter(img -> seenIds.add(img.getImageId())) // Only allow unique IDs
                    .map(img -> new ReviewImageDTO(img.getImageId(), img.getImageUrl()))
                    .collect(Collectors.toList()));
        }

        if (review.getReviewer() != null) {
            UserDTO reviewerDto = new UserDTO(
                    review.getReviewer().getUserId(),
                    review.getReviewer().getFullName(),
                    review.getReviewer().getProfilePictureUrl());
            reviewerDto.setProfileSlug(review.getReviewer().getProfileSlug());
            dto.setReviewer(reviewerDto);
        }

        try {
            TransactionEntity transaction = review.getTransaction();
            if (transaction != null) {
                if (transaction.getBuyer() != null && review.getReviewer() != null) {
                    if (transaction.getBuyer().getUserId().equals(review.getReviewer().getUserId())) {
                        dto.setReviewerRole("BUYER");
                    } else {
                        dto.setReviewerRole("SELLER");
                    }
                }
                if (transaction.getListing() != null) {
                    ListingDTO listingDto = new ListingDTO();
                    listingDto.setListingId(transaction.getListing().getListingId());
                    listingDto.setTitle(transaction.getListing().getTitle());
                    listingDto.setPrice(transaction.getListing().getPrice());

                    // Prioritize the image marked as "Cover Photo"
                    if (transaction.getListing().getImages() != null
                            && !transaction.getListing().getImages().isEmpty()) {
                        String coverUrl = transaction.getListing().getImages().stream()
                                .filter(img -> Boolean.TRUE.equals(img.getCoverPhoto())) // Look for cover photo
                                .map(ListingImageEntity::getImageUrl)
                                .findFirst() // If found, use it
                                .orElse(transaction.getListing().getImages().iterator().next().getImageUrl()); // Fallback
                                                                                                               // to
                                                                                                               // first

                        listingDto.setImageUrl(coverUrl);
                    }
                    dto.setListing(listingDto);
                }
            }
        } catch (jakarta.persistence.EntityNotFoundException | org.hibernate.ObjectNotFoundException e) {
            System.err.println("Warning: Review " + review.getReviewId() + " points to a missing transaction.");
            dto.setReviewerRole("UNKNOWN");
        }
        return dto;
    }

    public List<ReviewDTO> toDTOList(List<ReviewEntity> entities) {
        if (entities == null)
            return java.util.Collections.emptyList();
        return entities.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Page<ReviewDTO> toDTOPage(Page<ReviewEntity> page) {
        return page.map(this::toDTO);
    }
}
