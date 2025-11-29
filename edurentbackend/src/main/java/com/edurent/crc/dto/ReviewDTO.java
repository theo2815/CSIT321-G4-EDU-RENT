package com.edurent.crc.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ReviewDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private UserDTO reviewer;
    private ListingDTO listing;
    private String reviewerRole; // "BUYER" or "SELLER"
    private List<ReviewImageDTO> reviewImages;

    public ReviewDTO() {}

    public ReviewDTO(Long id, Integer rating, String comment, LocalDateTime createdAt, UserDTO reviewer, ListingDTO listing, String reviewerRole) {
        this.id = id;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.reviewer = reviewer;
        this.listing = listing;
        this.reviewerRole = reviewerRole;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UserDTO getReviewer() { return reviewer; }
    public void setReviewer(UserDTO reviewer) { this.reviewer = reviewer; }

    public ListingDTO getListing() { return listing; }
    public void setListing(ListingDTO listing) { this.listing = listing; }

    public String getReviewerRole() { return reviewerRole; }
    public void setReviewerRole(String reviewerRole) { this.reviewerRole = reviewerRole; }

    public List<ReviewImageDTO> getReviewImages() { return reviewImages; }
    public void setReviewImages(List<ReviewImageDTO> reviewImages) { this.reviewImages = reviewImages; }
}