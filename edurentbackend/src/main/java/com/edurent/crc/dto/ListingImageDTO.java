package com.edurent.crc.dto;

public class ListingImageDTO {
    private Long imageId;
    private String imageUrl;
    private Boolean isCoverPhoto;

    // Constructors
    public ListingImageDTO() {
    }

    public ListingImageDTO(Long imageId, String imageUrl, Boolean isCoverPhoto) {
        this.imageId = imageId;
        this.imageUrl = imageUrl;
        this.isCoverPhoto = isCoverPhoto;
    }

    // Getters and Setters
    public Long getImageId() {
        return imageId;
    }

    public void setImageId(Long imageId) {
        this.imageId = imageId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsCoverPhoto() {
        return isCoverPhoto;
    }

    public void setIsCoverPhoto(Boolean isCoverPhoto) {
        this.isCoverPhoto = isCoverPhoto;
    }
}
