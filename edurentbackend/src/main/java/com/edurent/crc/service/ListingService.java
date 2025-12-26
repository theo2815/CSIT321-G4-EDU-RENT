package com.edurent.crc.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private ListingRepository listingRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ListingImageRepository listingImageRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Centralized list of statuses visible to the public (Dashboard, Browse,
    // Categories)
    private final List<String> PUBLIC_STATUSES = Arrays.asList("Available", "Rented", "AVAILABLE", "RENTED");

    // Statuses visible on a user's public profile (Includes Sold history)
    private final List<String> PROFILE_STATUSES = Arrays.asList("Available", "Rented", "Sold", "AVAILABLE", "RENTED",
            "SOLD");

    // --- Core Listing Logic ---

    @Transactional
    public ListingEntity createListingWithImages(ListingEntity listing, Long userId, Long categoryId,
            List<MultipartFile> images) throws IOException {
        // 1. Fetch User and Category
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        CategoryEntity category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));

        // 2. Setup Listing Details
        listing.setUser(user);
        listing.setCategory(category);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setStatus("Available");

        // 3. Save Listing First (to get the ID)
        ListingEntity savedListing = listingRepository.save(listing);
        // Long listingId = savedListing.getListingId(); // Removed as unused

        // 4. Handle Images in Parallel
        if (images != null && !images.isEmpty()) {

            // Create a list of async tasks (Futures)
            List<CompletableFuture<ListingImageEntity>> uploadFutures = images.stream()
                    .filter(img -> !img.isEmpty()) // Skip empty files
                    .map(imageFile -> CompletableFuture.supplyAsync(() -> {
                        try {
                            // Upload to Cloudinary
                            String publicUrl = cloudinaryService.uploadImage(imageFile, "listings");

                            // Create Entity object (but don't save to DB yet)
                            ListingImageEntity listingImage = new ListingImageEntity();
                            listingImage.setListing(savedListing);
                            listingImage.setImageUrl(publicUrl);
                            listingImage.setCoverPhoto(false); // Default false, we set true later

                            return listingImage;
                        } catch (IOException e) {
                            throw new RuntimeException("Image upload failed", e);
                        }
                    }))
                    .collect(Collectors.toList());

            // Wait for ALL uploads to finish and collect results
            List<ListingImageEntity> listingImages = uploadFutures.stream()
                    .map(CompletableFuture::join) // This waits for the threads to finish
                    .collect(Collectors.toList());

            // Set the first image as Cover Photo
            if (!listingImages.isEmpty()) {
                listingImages.get(0).setCoverPhoto(true);
            }

            // Save all image records to the database in one batch
            listingImageRepository.saveAll(listingImages);
        }

        return savedListing;
    }

    @Transactional
    public ListingEntity updateListing(
            String listingIdentifier,
            Long currentUserId,
            Long categoryId,
            ListingEntity updateData,
            List<Long> imagesToDelete,
            List<MultipartFile> newImages) throws IOException {

        ListingEntity existingListing;
        try {
            Long id = Long.parseLong(listingIdentifier);
            existingListing = listingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Listing not found: " + listingIdentifier));
        } catch (NumberFormatException e) {
            existingListing = listingRepository.findByPublicId(listingIdentifier)
                    .orElseThrow(() -> new RuntimeException("Listing not found: " + listingIdentifier));
        }

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
                if (image.getListing().getListingId().equals(existingListing.getListingId())) {
                    cloudinaryService.deleteImage(image.getImageUrl());
                    existingListing.getImages().remove(image);
                }
            }
            listingImageRepository.deleteAll(imagesToRemove);
        }

        if (newImages != null && !newImages.isEmpty()) {
            boolean needsNewCover = existingListing.getImages().stream().noneMatch(ListingImageEntity::isCoverPhoto);
            final boolean finalNeedsNewCover = needsNewCover; // For lambda access

            // Create parallel upload tasks
            List<CompletableFuture<ListingImageEntity>> uploadFutures = newImages.stream()
                    .filter(img -> !img.isEmpty())
                    .map(imageFile -> CompletableFuture.supplyAsync(() -> {
                        try {

                            String publicUrl = cloudinaryService.uploadImage(imageFile, "listings");

                            ListingImageEntity listingImage = new ListingImageEntity();
                            listingImage.setListing(existingListing);
                            listingImage.setImageUrl(publicUrl);
                            listingImage.setCoverPhoto(false); // We handle this after collecting

                            return listingImage;
                        } catch (IOException e) {
                            throw new RuntimeException("Image upload failed", e);
                        }
                    }))
                    .collect(Collectors.toList());

            // Wait for all
            List<ListingImageEntity> uploadedImages = uploadFutures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toList());

            // Set cover photo logic
            boolean setCoverForBatch = false;
            for (ListingImageEntity img : uploadedImages) {
                if (finalNeedsNewCover && !setCoverForBatch) {
                    img.setCoverPhoto(true);
                    setCoverForBatch = true; // Only set one from the new batch
                } else {
                    img.setCoverPhoto(false);
                }
                existingListing.getImages().add(img);
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

    public Optional<ListingEntity> getListingByPublicId(String publicId) {
        return listingRepository.findByPublicId(publicId);
    }

    // Fetches listings for a specific user.
    // If includeInactive is true, returns EVERYTHING (for "Manage Listings").
    // If false, returns only PUBLIC items (for public profile view).
    public Page<ListingEntity> getListingsByUserId(Long userId, int page, int size, boolean includeInactive,
            String statusGroup, String listingType) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (includeInactive) {
            return listingRepository.findByUserId(userId, pageable);
        } else {
            List<String> statusesToFetch;
            if ("active".equalsIgnoreCase(statusGroup)) {
                statusesToFetch = Arrays.asList("Available", "Rented", "AVAILABLE", "RENTED");
            } else if ("sold".equalsIgnoreCase(statusGroup)) {
                statusesToFetch = Arrays.asList("Sold", "SOLD");
            } else {
                // Default: All public profile statuses (Active + Sold)
                statusesToFetch = PROFILE_STATUSES;
            }

            if (listingType != null && !listingType.isEmpty()) {
                String formattedType = listingType.equalsIgnoreCase("rent") ? "For Rent"
                        : listingType.equalsIgnoreCase("sale") ? "For Sale" : listingType;
                return listingRepository.findByUser_UserIdAndListingTypeAndStatusIn(userId, formattedType,
                        statusesToFetch, pageable);
            } else {
                return listingRepository.findByUser_UserIdAndStatusIn(userId, statusesToFetch, pageable);
            }
        }
    }

    // Kept for backward compatibility if needed, though controller uses the new one
    public Page<ListingEntity> getListingsByUserId(Long userId, int page, int size, boolean includeInactive) {
        return getListingsByUserId(userId, page, size, includeInactive, null, null);
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
                cloudinaryService.deleteImage(image.getImageUrl());
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