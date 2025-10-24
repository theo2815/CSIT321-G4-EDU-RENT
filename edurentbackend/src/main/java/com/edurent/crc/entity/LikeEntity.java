package com.edurent.crc.entity;

import jakarta.persistence.*;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "likes")
public class LikeEntity {

    @EmbeddedId
    private LikeIdEntity id = new LikeIdEntity(); // Updated to use LikeIdEntity

    // --- Relationships ---
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    @JsonBackReference(value = "user-likes")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("listingId")
    @JoinColumn(name = "listing_id")
    @JsonBackReference(value = "listing-likes")
    private ListingEntity listing;

    // Constructors
    public LikeEntity() {
    }

    // All-arg constructor (for LikeService)
    public LikeEntity(LikeIdEntity id, UserEntity user, ListingEntity listing) {
        this.id = id;
        this.user = user;
        this.listing = listing;
    }

    // Getters and Setters
    public LikeIdEntity getId() {
        return id;
    }

    public void setId(LikeIdEntity id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public ListingEntity getListing() {
        return listing;
    }

    public void setListing(ListingEntity listing) {
        this.listing = listing;
    }

    // equals, hashCode, toString (use id)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LikeEntity that = (LikeEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "LikeEntity{" +
                "id=" + id +
                '}';
    }
}

