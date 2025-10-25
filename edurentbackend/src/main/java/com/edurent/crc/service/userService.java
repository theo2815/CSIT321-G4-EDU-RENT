package com.edurent.crc.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edurent.crc.dto.AuthResponse;
import com.edurent.crc.dto.LoginRequest;
import com.edurent.crc.dto.RegisterRequest;
import com.edurent.crc.entity.SchoolEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.SchoolRepository;
import com.edurent.crc.repository.UserRepository;
import com.edurent.crc.security.JwtService;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SchoolRepository schoolRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private AuthenticationManager authenticationManager;

    /**
     * Registers a new user and returns a token.
     * @param request DTO with registration details.
     * @return AuthResponse containing the JWT.
     */
    public AuthResponse registerUser(RegisterRequest request) {
        // 1. Find the school
        SchoolEntity school = schoolRepository.findById(request.getSchoolId())
                .orElseThrow(() -> new IllegalStateException("School not found with id: " + request.getSchoolId()));

        // 2. Validate email domain
        if (!request.getEmail().endsWith(school.getEmailDomain())) {
            throw new IllegalStateException("Email domain must match the school's domain: " + school.getEmailDomain());
        }

        // 3. Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already registered.");
        }
        if (userRepository.findByStudentIdNumber(request.getStudentIdNumber()).isPresent()) {
             throw new IllegalStateException("Student ID already registered.");
        }

        // 4. Create new UserEntity
        UserEntity newUser = new UserEntity();
        newUser.setFullName(request.getFullName());
        newUser.setStudentIdNumber(request.getStudentIdNumber());
        newUser.setEmail(request.getEmail());
        newUser.setPhoneNumber(request.getPhoneNumber());
        newUser.setAddress(request.getAddress());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword())); // Hash the password
        newUser.setSchool(school);
        newUser.setCreatedAt(LocalDateTime.now());
        
        // 5. Save the user
        UserEntity savedUser = userRepository.save(newUser);

        // 6. Generate and return the token
        String token = jwtService.generateToken(savedUser);
        return new AuthResponse(token, "User registered successfully.");
    }

    /**
     * Authenticates a user and returns a token.
     * @param request DTO with login credentials.
     * @return AuthResponse containing the JWT.
     */
    public AuthResponse loginUser(LoginRequest request) {
        // 1. Let Spring Security do the authentication
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        // 2. If authentication is successful, get the user
        UserEntity user = (UserEntity) authentication.getPrincipal();

        // 3. Generate and return the token
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "User logged in successfully.");
    }


    // --- Other User Service Methods ---

    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<UserEntity> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<UserEntity> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

