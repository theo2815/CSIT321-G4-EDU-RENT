package com.edurent.crc.entity;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "listing_images")
public class ListingImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Long imageId;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "is_cover_photo", nullable = false)
    private Boolean isCoverPhoto = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    @JsonBackReference(value = "listing-images")
    private ListingEntity listing;

    // Constructors
    public ListingImageEntity() {
    }

    // Getters and Setters (Fixes ListingImageService error)
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

    public Boolean getCoverPhoto() {
        return isCoverPhoto;
    }

    public void setCoverPhoto(Boolean coverPhoto) {
        isCoverPhoto = coverPhoto;
    }

    public ListingEntity getListing() {
        return listing;
    }

    public void setListing(ListingEntity listing) {
        this.listing = listing;
    }

    public Boolean isCoverPhoto() { 
        return isCoverPhoto; 
    }

    public void setIsCoverPhoto(Boolean isCoverPhoto) { 
        this.isCoverPhoto = isCoverPhoto; 
    }


    // equals, hashCode, toString (excluding relationships)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ListingImageEntity that = (ListingImageEntity) o;
        return Objects.equals(imageId, that.imageId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(imageId);
    }

    @Override
    public String toString() {
        return "ListingImageEntity{" +
                "imageId=" + imageId +
                ", imageUrl='" + imageUrl + '\'' +
                '}';
    }
}

