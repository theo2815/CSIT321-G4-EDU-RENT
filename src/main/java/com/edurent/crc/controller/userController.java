package com.edurent.crc.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}