package com.edurent.crc.service;

import com.edurent.crc.entity.SchoolEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.SchoolRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder; 


@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserEntity> getAllUsers() { // Updated
        return userRepository.findAll();
    }

    public Optional<UserEntity> getUserById(Long id) { // Updated
        return userRepository.findById(id);
    }

    public Optional<UserEntity> getUserByEmail(String email) { // Updated
        return userRepository.findByEmail(email);
    }

    public UserEntity createUser(UserEntity user, Long schoolId) { // Updated

        SchoolEntity school = schoolRepository.findById(schoolId) // Updated
                .orElseThrow(() -> new RuntimeException("School not found with id: " + schoolId));
        
        if (!user.getEmail().endsWith(school.getEmailDomain())) {
            throw new IllegalStateException("Email domain must match the school's domain: " + school.getEmailDomain());
        }

        // --- HASH THE PASSWORD ---
            // Get the plain-text password from the user object
            String plainPassword = user.getPasswordHash(); 
            // Hash it
            String hashedPassword = passwordEncoder.encode(plainPassword);
            // Set the *hashed* password back on the user object
            user.setPasswordHash(hashedPassword);
            // -------------------------

        user.setSchool(school);
        return userRepository.save(user);
    }

    

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

