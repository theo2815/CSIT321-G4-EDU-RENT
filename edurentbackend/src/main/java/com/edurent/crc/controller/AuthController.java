package com.edurent.crc.controller;

import com.edurent.crc.dto.AuthResponse;
import com.edurent.crc.dto.ForgotPasswordRequest;
import com.edurent.crc.dto.LoginRequest;
import com.edurent.crc.dto.RegisterRequest;
import com.edurent.crc.dto.ResetPasswordRequest;
import com.edurent.crc.service.PasswordResetService;
import com.edurent.crc.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;

    @Autowired
    public AuthController(UserService userService, PasswordResetService passwordResetService) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
    }

    // Endpoints
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse authResponse = userService.registerUser(registerRequest);
            return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            // Catches domain mismatches or if user already exists
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new AuthResponse(null, "An unexpected error occurred."));
        }
    }

    // Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse authResponse = userService.loginUser(loginRequest);
            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            // Catches bad credentials or other login issues
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, "Invalid email or password."));
        }
    }

    // Forgot Password Endpoint
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.requestPasswordReset(request.getEmail());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "If an account with that email exists, a password reset link has been sent.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An error occurred. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Reset Password Endpoint
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password successfully reset. You can now login with your new password.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

