package com.edurent.crc.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class LikeIdEntity implements Serializable { // Renamed

    private static final long serialVersionUID = 1L;

    private Long userId;
    private Long listingId;

    // No-arg constructor (required by JPA)
    public LikeIdEntity() {
    }

    // All-arg constructor (fixes your service error)
    public LikeIdEntity(Long userId, Long listingId) {
        this.userId = userId;
        this.listingId = listingId;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LikeIdEntity that = (LikeIdEntity) o;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(listingId, that.listingId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, listingId);
    }
}
