package com.edurent.crc.dto;
// Data Transfer Object - DTO
// This DTO is sent back to the user after a successful login/register
public class AuthResponse {

    private String token;
    private String message;

    // No-argument constructor
    public AuthResponse() {
    }

    // All-arguments constructor
    public AuthResponse(String token, String message) {
        this.token = token;
        this.message = message;
    }

    // Getters
    public String getToken() {
        return token;
    }

    public String getMessage() {
        return message;
    }

    // Setters
    public void setToken(String token) {
        this.token = token;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

