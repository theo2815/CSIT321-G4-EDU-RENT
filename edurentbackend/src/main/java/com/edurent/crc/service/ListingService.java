package com.edurent.crc.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.edurent.crc.entity.CategoryEntity;
import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.ListingImageEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.CategoryRepository;
import com.edurent.crc.repository.ListingImageRepository;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class ListingService {

    @Autowired private ListingRepository listingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ListingImageRepository listingImageRepository;

    @Value("${supabase.url}") private String supabaseUrl;
    @Value("${supabase.key}") private String supabaseKey;
    @Value("${supabase.bucket}") private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    // Centralized list of statuses visible to the public (Dashboard, Browse, Categories)
    private final List<String> PUBLIC_STATUSES = Arrays.asList("Available", "Rented", "AVAILABLE", "RENTED");
    
    // Statuses visible on a user's public profile (Includes Sold history)
    private final List<String> PROFILE_STATUSES = Arrays.asList("Available", "Rented", "Sold", "AVAILABLE", "RENTED", "SOLD");

    // --- Helper Methods ---

    private String uploadFileToSupabase(MultipartFile file, String fileName) throws IOException {
        String storageUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("apikey", supabaseKey);
        headers.setContentType(MediaType.valueOf(file.getContentType()));

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
        restTemplate.exchange(storageUrl, HttpMethod.POST, requestEntity, String.class);

        return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + fileName;
    }

    private void deleteFileFromSupabase(String imageUrl) {
        try {
            String[] parts = imageUrl.split("/" + bucketName + "/");
            if (parts.length < 2) return;
            
            String fileName = parts[1];
            String storageUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            restTemplate.exchange(storageUrl, HttpMethod.DELETE, requestEntity, String.class);
        } catch (Exception e) {
            System.err.println("Failed to delete file from Supabase: " + e.getMessage());
        }
    }

    // --- Core Listing Logic ---

    @Transactional
    public ListingEntity createListingWithImages(ListingEntity listing, Long userId, Long categoryId, List<MultipartFile> images) throws IOException {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        CategoryEntity category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));

        listing.setUser(user);
        listing.setCategory(category);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setStatus("Available"); 

        ListingEntity savedListing = listingRepository.save(listing);
        Long listingId = savedListing.getListingId();

        if (images != null && !images.isEmpty()) {
            boolean isFirstImage = true;
            for (MultipartFile imageFile : images) {
                if (!imageFile.isEmpty()) {
                    String originalFilename = imageFile.getOriginalFilename();
                    String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
                    String uniqueFilename = listingId + "_" + UUID.randomUUID().toString() + "_" + safeFilename;

                    String publicUrl = uploadFileToSupabase(imageFile, uniqueFilename);

                    ListingImageEntity listingImage = new ListingImageEntity();
                    listingImage.setListing(savedListing);
                    listingImage.setImageUrl(publicUrl);
                    listingImage.setCoverPhoto(isFirstImage);
                    listingImageRepository.save(listingImage);

                    isFirstImage = false;
                }
            }
        }
        return savedListing; 
    }

    @Transactional
    public ListingEntity updateListing(
            Long listingId,
            Long currentUserId,
            Long categoryId,
            ListingEntity updateData,
            List<Long> imagesToDelete, 
            List<MultipartFile> newImages
    ) throws IOException {
        
        ListingEntity existingListing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!existingListing.getUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to edit this listing.");
        }

        CategoryEntity category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));

        // Update basic fields
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

        // Handle image deletions
        if (imagesToDelete != null && !imagesToDelete.isEmpty()) {
            List<ListingImageEntity> imagesToRemove = listingImageRepository.findAllById(imagesToDelete);
            
            for (ListingImageEntity image : imagesToRemove) {
                if (image.getListing().getListingId().equals(listingId)) {
                    deleteFileFromSupabase(image.getImageUrl());
                    existingListing.getImages().remove(image);
                }
            }
            listingImageRepository.deleteAll(imagesToRemove);
        }

        // Handle new image uploads
        if (newImages != null && !newImages.isEmpty()) {
            boolean needsNewCover = existingListing.getImages().stream().noneMatch(ListingImageEntity::isCoverPhoto);

            for (MultipartFile imageFile : newImages) {
                if (!imageFile.isEmpty()) {
                    String originalFilename = imageFile.getOriginalFilename();
                    String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
                    String uniqueFilename = listingId + "_" + UUID.randomUUID().toString() + "_" + safeFilename;

                    String publicUrl = uploadFileToSupabase(imageFile, uniqueFilename);

                    ListingImageEntity listingImage = new ListingImageEntity();
                    listingImage.setListing(existingListing);
                    listingImage.setImageUrl(publicUrl);
                    
                    if (needsNewCover) {
                        listingImage.setCoverPhoto(true);
                        needsNewCover = false;
                    } else {
                        listingImage.setCoverPhoto(false);
                    }
                    
                    existingListing.getImages().add(listingImage);
                }
            }
        }
        
        // Ensure there is always a cover photo if images exist
        if (!existingListing.getImages().isEmpty() && 
             existingListing.getImages().stream().noneMatch(ListingImageEntity::isCoverPhoto)) {
            existingListing.getImages().iterator().next().setCoverPhoto(true);
        }

        return listingRepository.save(existingListing);
    }

    // --- Data Retrieval Methods ---

    public Page<ListingEntity> getAllListings(int page, int size) { 
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // Only return visible statuses to the public feed
        return listingRepository.findByStatusIn(PUBLIC_STATUSES, pageable);
    }

    public Optional<ListingEntity> getListingById(Long listingId) { 
        return listingRepository.findById(listingId); 
    }

    // Fetches listings for a specific user.
    // If includeInactive is true, returns EVERYTHING (for "Manage Listings").
    // If false, returns only PUBLIC items (for public profile view).
    public Page<ListingEntity> getListingsByUserId(Long userId, int page, int size, boolean includeInactive) { 
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        if (includeInactive) {
            return listingRepository.findByUser_UserId(userId, pageable); 
        } else {
            return listingRepository.findByUser_UserIdAndStatusIn(userId, PROFILE_STATUSES, pageable);
        }
    }

    public Page<ListingEntity> getListingsByCategoryId(Long categoryId, int page, int size) { 
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return listingRepository.findByCategory_CategoryIdAndStatusIn(categoryId, PUBLIC_STATUSES, pageable);
    }

    public Page<ListingEntity> getListingsByType(String listingType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return listingRepository.findByListingTypeAndStatusIn(listingType, PUBLIC_STATUSES, pageable);
    }

    // --- Listing Management ---

    @Transactional
    public void deleteListing(Long listingId, Long currentUserId) {
        ListingEntity existingListing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));
        
        if (!existingListing.getUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("User does not have permission to delete this listing.");
        }

        // Clean up cloud storage before DB deletion
        if (existingListing.getImages() != null) {
            for (ListingImageEntity image : existingListing.getImages()) {
                deleteFileFromSupabase(image.getImageUrl());
            }
        }
        listingRepository.delete(existingListing);
    }

    @Transactional
    public void updateListingStatus(Long listingId, String newStatus, Long currentUserId) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!listing.getUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("User does not have permission to edit this listing.");
        }

        listing.setStatus(newStatus);
        listingRepository.save(listing);
    }
}