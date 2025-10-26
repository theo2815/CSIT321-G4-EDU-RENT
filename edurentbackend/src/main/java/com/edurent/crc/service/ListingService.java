package com.edurent.crc.service;

import java.io.IOException; // Updated
import java.nio.file.Files; // Updated
import java.nio.file.Path; // Updated
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // <-- Import MultipartFile

import com.edurent.crc.entity.CategoryEntity; // <-- Import IOException
import com.edurent.crc.entity.ListingEntity; // <-- For unique filenames (example)
import com.edurent.crc.entity.ListingImageEntity; // <-- For file saving (example)
import com.edurent.crc.entity.UserEntity; // <-- For file saving (example)
import com.edurent.crc.repository.CategoryRepository; // <-- For file saving (example)
import com.edurent.crc.repository.ListingImageRepository; // <-- Import ListingImageEntity
import com.edurent.crc.repository.ListingRepository; // <-- Import ListingImageRepository
import com.edurent.crc.repository.UserRepository;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ListingImageRepository listingImageRepository;

    // --- Directory to save images (EXAMPLE ONLY - Use cloud storage in production!) ---
    // Make sure this directory exists on your server or change the path
    private final String UPLOAD_DIR = "./uploads/listing-images/";

    // --- NEW Service Method ---
    @Transactional // Good practice for operations involving multiple saves
    public ListingEntity createListingWithImages(ListingEntity listing, Long userId, Long categoryId, List<MultipartFile> images) throws IOException { // Add throws IOException
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        CategoryEntity category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        listing.setUser(user);
        listing.setCategory(category);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setStatus("Available"); // Default status

        // 1. Save the main ListingEntity first to get its ID
        ListingEntity savedListing = listingRepository.save(listing);
        Long listingId = savedListing.getListingId();

        // 2. Process and save images (Example: saving locally)
        // !!! IMPORTANT: This local saving is for DEMO ONLY. Use Supabase Storage, AWS S3, etc. in a real app !!!
        if (images != null && !images.isEmpty()) {
            // Ensure upload directory exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
             if (!Files.exists(uploadPath)) {
                 Files.createDirectories(uploadPath);
             }

            boolean isFirstImage = true;
            for (MultipartFile imageFile : images) {
                if (!imageFile.isEmpty()) {
                    // Generate a unique filename (e.g., listingId_uuid_originalName)
                    String originalFilename = imageFile.getOriginalFilename();
                    String uniqueFilename = listingId + "_" + UUID.randomUUID().toString() + "_" + originalFilename;
                    Path filePath = uploadPath.resolve(uniqueFilename);

                    // Save the file to the server's filesystem
                    Files.copy(imageFile.getInputStream(), filePath);

                    // Create and save ListingImageEntity
                    ListingImageEntity listingImage = new ListingImageEntity();
                    listingImage.setListing(savedListing);
                    // Store the relative path or URL accessible by the frontend
                    // For local, this might just be the filename or a relative path
                    listingImage.setImageUrl("/uploads/listing-images/" + uniqueFilename); // Adjust path based on how you serve static files
                    listingImage.setCoverPhoto(isFirstImage); // Set first image as cover
                    listingImageRepository.save(listingImage);

                    isFirstImage = false;
                }
            }
             // Refresh the listing entity to potentially include saved images if needed later
             // savedListing = listingRepository.findById(listingId).orElse(savedListing);
        }
        // !!! END OF LOCAL SAVING EXAMPLE !!!


        return savedListing; // Return the saved listing (without images populated unless refreshed)
    }
    // --- End NEW Service Method ---

    public List<ListingEntity> getAllListings() { // Updated
        return listingRepository.findAll();
    }

    public Optional<ListingEntity> getListingById(Long id) { // Updated
        return listingRepository.findById(id);
    }

    public List<ListingEntity> getListingsByUserId(Long userId) { // Updated
        return listingRepository.findByUser_UserId(userId);
    }

    public List<ListingEntity> getListingsByCategoryId(Long categoryId) { // Updated
        return listingRepository.findByCategoryId(categoryId);
    }

    public ListingEntity createListing(ListingEntity listing, Long userId, Long categoryId) { // Updated
        UserEntity user = userRepository.findById(userId) // Updated
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        CategoryEntity category = categoryRepository.findById(categoryId) // Updated
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        listing.setUser(user);
        listing.setCategory(category);
        listing.setCreatedAt(LocalDateTime.now());
        
        return listingRepository.save(listing);
    }

    public void deleteListing(Long id) {
        listingRepository.deleteById(id);
    }
}

