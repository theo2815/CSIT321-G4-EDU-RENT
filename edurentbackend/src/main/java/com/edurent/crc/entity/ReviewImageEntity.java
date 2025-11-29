package com.edurent.crc.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "review_images")
public class ReviewImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Long imageId;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    @JsonBackReference(value = "review-images")
    private ReviewEntity review;

    public ReviewImageEntity() {}

    public ReviewImageEntity(String imageUrl, ReviewEntity review) {
        this.imageUrl = imageUrl;
        this.review = review;
    }

    public Long getImageId() { return imageId; }
    public void setImageId(Long imageId) { this.imageId = imageId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public ReviewEntity getReview() { return review; }
    public void setReview(ReviewEntity review) { this.review = review; }
}