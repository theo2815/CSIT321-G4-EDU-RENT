package com.edurent.crc.dto;

// This DTO carries all info from the registration form
public class RegisterRequest {

    private String fullName;
    private String studentIdNumber;
    private String email;
    private String phoneNumber;
    private String address;
    private String password;
    private Long schoolId;

    // No-argument constructor
    public RegisterRequest() {
    }

    // Getters
    public String getFullName() { return fullName; }
    public String getStudentIdNumber() { return studentIdNumber; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddress() { return address; }
    public String getPassword() { return password; }
    public Long getSchoolId() { return schoolId; }

    // Setters
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setStudentIdNumber(String studentIdNumber) { this.studentIdNumber = studentIdNumber; }
    public void setEmail(String email) { this.email = email; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setAddress(String address) { this.address = address; }
    public void setPassword(String password) { this.password = password; }
    public void setSchoolId(Long schoolId) { this.schoolId = schoolId; }
}

