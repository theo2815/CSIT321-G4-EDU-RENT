package com.edurent.crc.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edurent.crc.dto.LoginRequest;
import com.edurent.crc.entity.userEntity;
import com.edurent.crc.service.userService;

@RestController
@RequestMapping("/api/users") // Base URL: /api/users
@CrossOrigin(origins = "http://localhost:3000")
public class userController {

    @Autowired
    private userService userService;

    // API to get all users (for testing)
    @GetMapping 
    public List<userEntity> getAllUsers() {
        return userService.findAllUsers();
    }
    
    // You would add methods for login, register, etc., here later!
    // This is the registration API. It listens for POST requests.
    @PostMapping
    public userEntity registerUser(@RequestBody userEntity newUser) {
        return userService.saveUser(newUser);
    }

     @PostMapping("/login")
    public ResponseEntity<userEntity> loginUser(@RequestBody LoginRequest loginRequest) {
        userEntity authenticatedUser = userService.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
        
        if (authenticatedUser != null) {
            // If login is successful, return the user data with a 200 OK status
            return ResponseEntity.ok(authenticatedUser);
        } else {
            // If login fails, return a 401 Unauthorized status
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}