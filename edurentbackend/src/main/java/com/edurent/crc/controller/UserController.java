package com.edurent.crc.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.dto.UpdateUserRequest;
import com.edurent.crc.service.UserService;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*") // Allow requests from any origin
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * A protected endpoint to get the currently authenticated user's details.
     * The user is identified by the JWT token.
     * @param authentication Automatically injected by Spring Security.
     * @return The authenticated UserEntity.
     */
    @GetMapping("/me")
    public ResponseEntity<UserEntity> getMyProfile(Authentication authentication) {
        // Spring Security, via the JwtAuthFilter, places the UserEntity in the 'principal'
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        return ResponseEntity.ok(currentUser);
    }

    /**
     * Admin-only (example) endpoint to get all users.
     * (We haven't implemented role-based security, but this is where it would go)
     * @return A list of all users.
     */
    @GetMapping
    public ResponseEntity<List<UserEntity>> getAllUsers() {
        List<UserEntity> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * Get a specific user by ID.
     * @param id The ID of the user.
     * @return The UserEntity or 404 Not Found.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserEntity> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a user by ID.
     * @param id The ID of the user to delete.
     * @return 204 No Content.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Update the currently authenticated user's profile details.
     * Accepts only editable fields (fullName, address, bio, phoneNumber, profilePictureUrl).
     */
    @PutMapping("/me")
    public ResponseEntity<UserEntity> updateMyProfile(Authentication authentication,
                                                      @RequestBody UpdateUserRequest request) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        UserEntity updated = userService.updateCurrentUser(currentUser, request);
        return ResponseEntity.ok(updated);
    }
}

