package com.edurent.crc.dto;

public class UserDTO {
    private Long userId;
    private String fullName;
    private String profilePictureUrl;
    private String schoolName;
    private String facebookUrl;
    private String instagramUrl;
    private String address;
    private String bio;
    private java.time.LocalDateTime createdAt;
    private String email;
    private String phoneNumber;
    private SchoolInfo school; // Nested for frontend compatibility

    // Nested class for school (frontend expects user.school.name)
    public static class SchoolInfo {
        private String name;

        public SchoolInfo() {
        }

        public SchoolInfo(String name) {
            this.name = name;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    // Constructors, Getters, Setters
    public UserDTO() {
    }

    public UserDTO(Long userId, String fullName, String profilePictureUrl) {
        this.userId = userId;
        this.fullName = fullName;
        this.profilePictureUrl = profilePictureUrl;
    }

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

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    private String profileSlug;

    public String getProfileSlug() {
        return profileSlug;
    }

    public void setProfileSlug(String profileSlug) {
        this.profileSlug = profileSlug;
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

    public SchoolInfo getSchool() {
        return school;
    }

    public void setSchool(SchoolInfo school) {
        this.school = school;
    }
}