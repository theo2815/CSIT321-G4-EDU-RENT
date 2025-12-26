package com.edurent.crc.controller;

import org.springframework.lang.NonNull;
import java.util.Objects;

import java.util.List;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    // Example endpoint to get the currently authenticated user
    @GetMapping("/me")
    public ResponseEntity<UserEntity> getMyProfile(Authentication authentication) {
        // Spring Security, via the JwtAuthFilter, places the UserEntity in the
        // 'principal'
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        return ResponseEntity.ok(currentUser);
    }

    // Get All Users
    @GetMapping
    public ResponseEntity<List<UserEntity>> getAllUsers() {
        List<UserEntity> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Get User by ID (Public Profile - Returns DTO to hide sensitive info)
    @GetMapping("/{id}")
    public ResponseEntity<com.edurent.crc.dto.UserDTO> getUserById(@PathVariable @NonNull Long id) {
        return userService.getUserById(id)
                .map(user -> {
                    com.edurent.crc.dto.UserDTO dto = new com.edurent.crc.dto.UserDTO(
                            user.getUserId(),
                            user.getFullName(),
                            user.getProfilePictureUrl());
                    if (user.getSchool() != null) {
                        dto.setSchoolName(user.getSchool().getName());
                    }
                    dto.setFacebookUrl(user.getFacebookUrl());
                    dto.setInstagramUrl(user.getInstagramUrl());
                    dto.setAddress(user.getAddress());
                    dto.setBio(user.getBio());
                    dto.setCreatedAt(user.getCreatedAt());
                    dto.setProfileSlug(user.getProfileSlug());
                    return dto;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get User by Username (Public Profile - Returns DTO to hide sensitive info)
    @GetMapping("/username/{username}")
    public ResponseEntity<com.edurent.crc.dto.UserDTO> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(user -> {
                    com.edurent.crc.dto.UserDTO dto = new com.edurent.crc.dto.UserDTO(
                            user.getUserId(),
                            user.getFullName(),
                            user.getProfilePictureUrl());
                    if (user.getSchool() != null) {
                        dto.setSchoolName(user.getSchool().getName());
                    }
                    dto.setFacebookUrl(user.getFacebookUrl());
                    dto.setInstagramUrl(user.getInstagramUrl());
                    dto.setAddress(user.getAddress());
                    dto.setBio(user.getBio());
                    dto.setCreatedAt(user.getCreatedAt());
                    dto.setProfileSlug(user.getProfileSlug());
                    return dto;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete User by ID (Secured: Users can only delete their own account)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable @NonNull Long id, Authentication authentication) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();

        if (!currentUser.getUserId().equals(id)) {
            // Log this security event if you have a logger
            return ResponseEntity.status(403).build();
        }

        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Update Current User Profile
    @PutMapping("/me")
    public ResponseEntity<UserEntity> updateMyProfile(Authentication authentication,
            @RequestBody UpdateUserRequest request) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        UserEntity updated = userService.updateCurrentUser(Objects.requireNonNull(currentUser), request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/me/image")
    public ResponseEntity<String> uploadProfileImage(Authentication authentication,
            @RequestParam("file") MultipartFile file) throws IOException {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        String imageUrl = userService.uploadProfilePicture(Objects.requireNonNull(currentUser), file);
        return ResponseEntity.ok(imageUrl);
    }
}
