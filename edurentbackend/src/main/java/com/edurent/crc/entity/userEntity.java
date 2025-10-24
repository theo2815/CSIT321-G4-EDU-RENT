package com.edurent.crc.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "student_id_number", nullable = false, unique = true)
    private String studentIdNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    private String address;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // --- Relationships ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    @JsonBackReference(value = "school-users")
    private SchoolEntity school;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-listings")
    private Set<ListingEntity> listings;

    @OneToMany(mappedBy = "buyer", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "buyer-transactions")
    private Set<TransactionEntity> transactionsAsBuyer;

    @OneToMany(mappedBy = "seller", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "seller-transactions")
    private Set<TransactionEntity> transactionsAsSeller;

    @OneToMany(mappedBy = "reviewer", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "reviewer-reviews")
    private Set<ReviewEntity> reviewsGiven;

    @OneToMany(mappedBy = "reviewedUser", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "reviewed-user-reviews")
    private Set<ReviewEntity> reviewsReceived;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-likes")
    private Set<LikeEntity> likes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-participants")
    private Set<ConversationParticipantEntity> conversationParticipants;

    @OneToMany(mappedBy = "sender", fetch = FetchType.LAZY)
    @JsonManagedReference(value = "sender-messages")
    private Set<MessageEntity> messagesSent;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "user-notifications")
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

    // equals, hashCode, toString (excluding relationships)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
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

