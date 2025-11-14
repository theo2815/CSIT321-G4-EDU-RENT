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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // <-- Import MultipartFile

import com.edurent.crc.entity.CategoryEntity;
import com.edurent.crc.entity.ListingEntity; // <-- Import IOException
import com.edurent.crc.entity.ListingImageEntity; // <-- For unique filenames (example)
import com.edurent.crc.entity.UserEntity; // <-- For file saving (example)
import com.edurent.crc.repository.CategoryRepository; // <-- For file saving (example)
import com.edurent.crc.repository.ListingImageRepository; // <-- For file saving (example)
import com.edurent.crc.repository.ListingRepository; // <-- Import ListingImageEntity
import com.edurent.crc.repository.UserRepository; // <-- Import ListingImageRepository


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

    // <--- REPLACED updateListing Service Method --->
    @Transactional
    public ListingEntity updateListing(
            Long listingId,
            Long currentUserId,
            Long categoryId,
            ListingEntity updateData,
            List<Long> imagesToDelete, // <-- NEW
            List<MultipartFile> newImages
    ) throws IOException {
        
        // 1. Find the existing listing
        ListingEntity existingListing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        // 2. Check if the current user owns this listing
        if (!existingListing.getUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("User does not have permission to edit this listing.");
        }

        // 3. Find the category
        CategoryEntity category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        // 4. Update all the text/data fields
        existingListing.setTitle(updateData.getTitle());
        existingListing.setCategory(category);
        existingListing.setCondition(updateData.getCondition());
        existingListing.setDescription(updateData.getDescription());
        existingListing.setListingType(updateData.getListingType());
        existingListing.setPrice(updateData.getPrice());
        existingListing.setAllowMeetup(updateData.getAllowMeetup());
        existingListing.setMeetupLocation(updateData.getMeetupLocation());
        existingListing.setAllowDelivery(updateData.getAllowDelivery());
        existingListing.setDeliveryOptions(updateData.getDeliveryOptions());

        // 5. --- NEW IMAGE DELETION LOGIC ---
        if (imagesToDelete != null && !imagesToDelete.isEmpty()) {
            System.out.println("Deleting " + imagesToDelete.size() + " images...");
            
            // Find all image entities to be deleted
            List<ListingImageEntity> imagesToRemove = listingImageRepository.findAllById(imagesToDelete);
            
            for (ListingImageEntity image : imagesToRemove) {
                // Security check: ensure the image belongs to the listing
                if (image.getListing().getListingId().equals(listingId)) {
                    // a. Delete file from disk
                    try {
                        // Reconstruct file path from URL
                        String filename = image.getImageUrl().substring("/uploads/listing-images/".length());
                        Path filePath = Paths.get(UPLOAD_DIR + filename);
                        Files.deleteIfExists(filePath);
                        System.out.println("Deleted file: " + filePath.toString());
                    } catch (IOException e) {
                        System.err.println("Failed to delete image file: " + image.getImageUrl() + " - " + e.getMessage());
                    }
                    
                    // b. Remove from the entity collection (for Hibernate's session)
                    existingListing.getImages().remove(image);
                }
            }
            // c. Delete from database
            listingImageRepository.deleteAll(imagesToRemove);
        }

        // 6. --- NEW IMAGE ADDITION LOGIC ---
        if (newImages != null && !newImages.isEmpty()) {
            System.out.println("Adding " + newImages.size() + " new images...");
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            // Check if *any* cover photo will remain after deletions
            boolean needsNewCover = existingListing.getImages().stream().noneMatch(ListingImageEntity::isCoverPhoto);

            for (MultipartFile imageFile : newImages) {
                if (!imageFile.isEmpty()) {
                    String originalFilename = imageFile.getOriginalFilename();
                    String uniqueFilename = listingId + "_" + UUID.randomUUID().toString() + "_" + originalFilename;
                    Path filePath = uploadPath.resolve(uniqueFilename);
                    Files.copy(imageFile.getInputStream(), filePath);

                    ListingImageEntity listingImage = new ListingImageEntity();
                    listingImage.setListing(existingListing);
                    listingImage.setImageUrl("/uploads/listing-images/" + uniqueFilename);
                    
                    // Set as cover if it's the first *new* image AND no old cover photo remains
                    if (needsNewCover) {
                        listingImage.setCoverPhoto(true);
                        needsNewCover = false; // Only set one new cover photo
                    } else {
                        listingImage.setCoverPhoto(false);
                    }
                    
                    existingListing.getImages().add(listingImage);
                }
            }
        }
        
        // 7. --- COVER PHOTO FALLBACK ---
        // If (after deletes and adds) there are still no cover photos, assign one
        if (!existingListing.getImages().isEmpty() && 
             existingListing.getImages().stream().noneMatch(ListingImageEntity::isCoverPhoto)) {
            
            System.out.println("Assigning new cover photo...");
            existingListing.getImages().iterator().next().setCoverPhoto(true);
        }

        // 8. Save the updated listing (Cascade will save new/updated images)
        return listingRepository.save(existingListing);
    }
    // --- End REPLACED Method ---

    public List<ListingEntity> getAllListings() { // Updated
        return listingRepository.findAll();
    }

    public Optional<ListingEntity> getListingById(Long listingId) {
        return listingRepository.findById(listingId);
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

// <--- UPDATED: deleteListing with file deletion logic --->
    @Transactional
    public void deleteListing(Long listingId, Long currentUserId) {
        // 1. Find the listing
        ListingEntity existingListing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));
        
        // 2. Check ownership
        if (!existingListing.getUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("User does not have permission to delete this listing.");
        }

        // 3. Delete associated image files from disk (CRITICAL)
        if (existingListing.getImages() != null) {
            for (ListingImageEntity image : existingListing.getImages()) {
                try {
                    String filename = image.getImageUrl().substring("/uploads/listing-images/".length());
                    Path filePath = Paths.get(UPLOAD_DIR + filename);
                    Files.deleteIfExists(filePath);
                } catch (IOException e) {
                    System.err.println("Failed to delete image file: " + image.getImageUrl() + " - " + e.getMessage());
                }
            }
        }

        // 4. Delete the listing from the database
        listingRepository.delete(existingListing);
    }
    

}