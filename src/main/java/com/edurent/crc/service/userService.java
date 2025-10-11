package com.edurent.crc.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edurent.crc.entity.userEntity;
import com.edurent.crc.repository.userRepository;

@Service
public class userService {

    @Autowired
    private userRepository userRepository;

    public List<userEntity> findAllUsers() {
        return userRepository.findAll();
    }
    
     // This method saves the user object to the database.
    public userEntity saveUser(userEntity user) {
        // In a real application, you MUST hash the password before saving!
        // Example using a library like BCrypt:
        // user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

     public userEntity loginUser(String email, String password) {
        // Find the user by email
        Optional<userEntity> userOptional = userRepository.findByEmail(email);

        // Check if user exists and if the password matches
        if (userOptional.isPresent()) {
            userEntity user = userOptional.get();
            // !! IMPORTANT SECURITY NOTE !!
            // This is a plain text password comparison. In a real application,
            // you MUST hash the password during registration and compare the hash here.
            // Example: if (passwordEncoder.matches(password, user.getPassword())) { ... }
            if (password.equals(user.getPassword())) {
                return user; // Login successful
            }
        }
        
        // If user not found or password incorrect, return null
        return null;
    }
}
