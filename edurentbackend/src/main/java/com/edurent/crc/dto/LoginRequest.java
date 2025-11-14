package com.edurent.crc.dto;

public class LoginRequest {

    private String email;
    private String password;

    // No-argument constructor
    public LoginRequest() {
    }

    // All-arguments constructor
    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Getters
    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    // Setters
    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

