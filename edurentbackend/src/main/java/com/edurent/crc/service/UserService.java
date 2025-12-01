package com.edurent.crc.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.edurent.crc.dto.AuthResponse;
import com.edurent.crc.dto.LoginRequest;
import com.edurent.crc.dto.RegisterRequest;
import com.edurent.crc.dto.UpdateUserRequest;
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

    // --- Supabase Config ---
    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private final String PROFILE_BUCKET = "profile-images";
    private final RestTemplate restTemplate = new RestTemplate();

    // --- Delete Old Profile Image Helper ---
    private void deleteOldProfileImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) return;
        
        try {
            String[] parts = imageUrl.split("/" + PROFILE_BUCKET + "/");
            
            if (parts.length < 2) return; 
            
            String filePath = parts[1];
            String storageUrl = supabaseUrl + "/storage/v1/object/" + PROFILE_BUCKET + "/" + filePath;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            restTemplate.exchange(storageUrl, HttpMethod.DELETE, requestEntity, String.class);
            
            System.out.println("✅ Deleted old profile image: " + filePath);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to delete old profile image: " + e.getMessage());
        }
    }

    // --- Auth Methods ---
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

    // Login Method
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

    // Update Current User Profile
    public UserEntity updateCurrentUser(UserEntity currentUser, UpdateUserRequest req) {
        if (req.getFullName() != null) currentUser.setFullName(req.getFullName());
        if (req.getAddress() != null) currentUser.setAddress(req.getAddress());
        if (req.getBio() != null) currentUser.setBio(req.getBio());
        if (req.getPhoneNumber() != null) currentUser.setPhoneNumber(req.getPhoneNumber());
        
        // --- IMAGE UPDATE LOGIC ---
        if (req.getProfilePictureUrl() != null) {
            String oldUrl = currentUser.getProfilePictureUrl();
            String newUrl = req.getProfilePictureUrl();

            // Only delete if there was an old image and the URL has actually changed
            if (oldUrl != null && !oldUrl.isEmpty() && !oldUrl.equals(newUrl)) {
                deleteOldProfileImage(oldUrl);
            }
            
            currentUser.setProfilePictureUrl(newUrl);
        }

        return userRepository.save(currentUser);
    }
}

