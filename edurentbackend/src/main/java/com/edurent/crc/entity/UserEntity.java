package com.edurent.crc.entity;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.Objects;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@NamedEntityGraph(name = "User.withSchool", attributeNodes = @NamedAttributeNode("school"))
public class UserEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "student_id_number", nullable = false, unique = true)
    private String studentIdNumber;

    @Column(name = "username", unique = true)
    private String username; // URL-friendly identifier for profile pages

    @Column(nullable = false, unique = true)
    private String email; // This will be our "username" for Spring Security

    @Column(name = "phone_number")
    private String phoneNumber;

    private String address;

    @Column(name = "password_hash", nullable = false)
    @JsonIgnore
    private String passwordHash; // This is our "password" for Spring Security

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "bio", length = 1000)
    private String bio;

    @Column(name = "facebook_url", length = 500)
    private String facebookUrl;

    @Column(name = "instagram_url", length = 500)
    private String instagramUrl;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // --- Relationships ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "school_id", nullable = false)
    @JsonIgnoreProperties({ "users", "hibernateLazyInitializer", "handler" })
    private SchoolEntity school;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // @JsonManagedReference(value = "user-listings")
    @JsonIgnore
    private Set<ListingEntity> listings;

    @OneToMany(mappedBy = "buyer", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "buyer-transactions")
    @JsonIgnore
    private Set<TransactionEntity> transactionsAsBuyer;

    @OneToMany(mappedBy = "seller", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "seller-transactions")
    @JsonIgnore
    private Set<TransactionEntity> transactionsAsSeller;

    @OneToMany(mappedBy = "reviewer", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "reviewer-reviews")
    @JsonIgnore
    private Set<ReviewEntity> reviewsGiven;

    @OneToMany(mappedBy = "reviewedUser", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "reviewed-user-reviews")
    @JsonIgnore
    private Set<ReviewEntity> reviewsReceived;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-likes")
    @JsonIgnore
    private Set<LikeEntity> likes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-participants")
    @JsonIgnore
    private Set<ConversationParticipantEntity> conversationParticipants;

    @OneToMany(mappedBy = "sender", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "sender-messages")
    @JsonIgnore
    private Set<MessageEntity> messagesSent;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-notifications")
    @JsonIgnore
    private Set<NotificationEntity> notifications;

    // Constructors
    public UserEntity() {
    }

    // Getters and Setters (Fixes UserService errors)
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getStudentIdNumber() {
        return studentIdNumber;
    }

    public void setStudentIdNumber(String studentIdNumber) {
        this.studentIdNumber = studentIdNumber;
    }

    public String getProfileSlug() {
        return username;
    }

    public void setProfileSlug(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getFacebookUrl() {
        return facebookUrl;
    }

    public void setFacebookUrl(String facebookUrl) {
        this.facebookUrl = facebookUrl;
    }

    public String getInstagramUrl() {
        return instagramUrl;
    }

    public void setInstagramUrl(String instagramUrl) {
        this.instagramUrl = instagramUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public SchoolEntity getSchool() {
        return school;
    }

    public void setSchool(SchoolEntity school) {
        this.school = school;
    }

    public Set<ListingEntity> getListings() {
        return listings;
    }

    public void setListings(Set<ListingEntity> listings) {
        this.listings = listings;
    }

    public Set<TransactionEntity> getTransactionsAsBuyer() {
        return transactionsAsBuyer;
    }

    public void setTransactionsAsBuyer(Set<TransactionEntity> transactionsAsBuyer) {
        this.transactionsAsBuyer = transactionsAsBuyer;
    }

    public Set<TransactionEntity> getTransactionsAsSeller() {
        return transactionsAsSeller;
    }

    public void setTransactionsAsSeller(Set<TransactionEntity> transactionsAsSeller) {
        this.transactionsAsSeller = transactionsAsSeller;
    }

    public Set<ReviewEntity> getReviewsGiven() {
        return reviewsGiven;
    }

    public void setReviewsGiven(Set<ReviewEntity> reviewsGiven) {
        this.reviewsGiven = reviewsGiven;
    }

    public Set<ReviewEntity> getReviewsReceived() {
        return reviewsReceived;
    }

    public void setReviewsReceived(Set<ReviewEntity> reviewsReceived) {
        this.reviewsReceived = reviewsReceived;
    }

    public Set<LikeEntity> getLikes() {
        return likes;
    }

    public void setLikes(Set<LikeEntity> likes) {
        this.likes = likes;
    }

    public Set<ConversationParticipantEntity> getConversationParticipants() {
        return conversationParticipants;
    }

    public void setConversationParticipants(Set<ConversationParticipantEntity> conversationParticipants) {
        this.conversationParticipants = conversationParticipants;
    }

    public Set<MessageEntity> getMessagesSent() {
        return messagesSent;
    }

    public void setMessagesSent(Set<MessageEntity> messagesSent) {
        this.messagesSent = messagesSent;
    }

    public Set<NotificationEntity> getNotifications() {
        return notifications;
    }

    public void setNotifications(Set<NotificationEntity> notifications) {
        this.notifications = notifications;
    }

    // --- UserDetails Implementation Methods ---

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // For now, assign a simple role to every user.
        // Later, you could add a 'role' field to UserEntity.
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    @JsonIgnore
    public String getPassword() {
        // Return the hashed password field
        return this.passwordHash;
    }

    @Override
    @JsonIgnore
    public String getUsername() {
        // Use email as the username for authentication
        return this.email;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true; // Keep accounts always active for now
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true; // Keep accounts always unlocked for now
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true; // Keep credentials always valid for now
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return true; // Keep accounts always enabled for now
    }

    // equals, hashCode, toString (excluding relationships)
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserEntity that = (UserEntity) o;
        return Objects.equals(userId, that.userId) &&
                Objects.equals(email, that.email) &&
                Objects.equals(studentIdNumber, that.studentIdNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, email, studentIdNumber);
    }

    @Override
    public String toString() {
        return "UserEntity{" +
                "userId=" + userId +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
