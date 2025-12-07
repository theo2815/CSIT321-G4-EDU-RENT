package com.edurent.crc.dto;

public class UserDTO {
    private Long userId;
    private String fullName;
    private String profilePictureUrl;
    private String schoolName;

    // Constructors, Getters, Setters
    public UserDTO() {}
    
    public UserDTO(Long userId, String fullName, String profilePictureUrl) {
        this.userId = userId;
        this.fullName = fullName;
        this.profilePictureUrl = profilePictureUrl;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
}