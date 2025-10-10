package com.edurent.crc.service;

import java.util.List;

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
}
