package com.edurent.crc.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ListingDTO {
    private Long listingId;
    private String publicId;
    private String title;
    private String description;
    private String condition;
    private String listingType;
    private Double price;
    private String rentPeriod;
    private String status;
    private Boolean allowMeetup;
    private String meetupLocation;
    private Boolean allowDelivery;
    private String deliveryOptions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Nested DTOs
    // private UserDTO user; // Aliased to owner
    private CategoryDTO category;
    private List<ListingImageDTO> images;

    // Constructors
    public ListingDTO() {
    }

    // Getters and Setters
    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public String getPublicId() {
        return publicId;
    }

    public void setPublicId(String publicId) {
        this.publicId = publicId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getListingType() {
        return listingType;
    }

    public void setListingType(String listingType) {
        this.listingType = listingType;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getRentPeriod() {
        return rentPeriod;
    }

    public void setRentPeriod(String rentPeriod) {
        this.rentPeriod = rentPeriod;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getAllowMeetup() {
        return allowMeetup;
    }

    public void setAllowMeetup(Boolean allowMeetup) {
        this.allowMeetup = allowMeetup;
    }

    public String getMeetupLocation() {
        return meetupLocation;
    }

    public void setMeetupLocation(String meetupLocation) {
        this.meetupLocation = meetupLocation;
    }

    public Boolean getAllowDelivery() {
        return allowDelivery;
    }

    public void setAllowDelivery(Boolean allowDelivery) {
        this.allowDelivery = allowDelivery;
    }

    public String getDeliveryOptions() {
        return deliveryOptions;
    }

    public void setDeliveryOptions(String deliveryOptions) {
        this.deliveryOptions = deliveryOptions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UserDTO getUser() {
        return owner;
    }

    public void setUser(UserDTO user) {
        this.owner = user;
    }

    public CategoryDTO getCategory() {
        return category;
    }

    public void setCategory(CategoryDTO category) {
        this.category = category;
    }

    public List<ListingImageDTO> getImages() {
        return images;
    }

    public void setImages(List<ListingImageDTO> images) {
        this.images = images;
    }

    // --- Backward Compatibility Fields (for existing controller usage) ---
    private String imageUrl;
    private UserDTO owner;

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public UserDTO getOwner() {
        return owner;
    }

    public void setOwner(UserDTO owner) {
        this.owner = owner;
    }
}