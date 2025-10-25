package com.edurent.crc.controller;

import com.edurent.crc.dto.AuthResponse;
import com.edurent.crc.dto.LoginRequest;
import com.edurent.crc.dto.RegisterRequest;
import com.edurent.crc.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // Allow requests from any origin (e.g., your React app)
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Registers a new user in the system.
     * @param registerRequest DTO containing registration details
     * @return A response entity with the AuthResponse (token and user info) or an error.
     */
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

    /**
     * Authenticates an existing user.
     * @param loginRequest DTO containing login credentials
     * @return A response entity with the AuthResponse (token and user info) or an error.
     */
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
}

