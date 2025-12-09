package com.edurent.crc.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.service.ListingService;

@RestController
@RequestMapping("/api/v1/listings")
@CrossOrigin(origins = "*")
public class ListingController {

    @Autowired
    private ListingService listingService;

    // Retrieves a list of all available listings in the system
    @GetMapping
    public Page<ListingEntity> getAllListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return listingService.getAllListings(page, size);
    }

    // Fetches a single listing by its unique ID. Returns 404 if not found.
    @GetMapping("/{listingId}") 
    public ResponseEntity<ListingEntity> getListingById(@PathVariable Long listingId) { 
        return listingService.getListingById(listingId) 
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Retrieves all listings created by a specific user profile
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<ListingEntity>> getListingsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<ListingEntity> listings = listingService.getListingsByUserId(userId, page, size);
        return ResponseEntity.ok(listings);
    }
    
    // Retrieves all listings belonging to a specific category
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ListingEntity>> getListingsByCategoryId(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<ListingEntity> listings = listingService.getListingsByCategoryId(categoryId, page, size);
        if (listings.isEmpty()) {
            return ResponseEntity.noContent().build(); 
        }
        return ResponseEntity.ok(listings);
    }

    // New endpoint for filtering by type (Rent/Sale) with pagination
    @GetMapping("/type/{listingType}")
    public ResponseEntity<Page<ListingEntity>> getListingsByType(
            @PathVariable String listingType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {        
        String formattedType = listingType.equalsIgnoreCase("rent") ? "For Rent" : 
                               listingType.equalsIgnoreCase("sale") ? "For Sale" : listingType;

        Page<ListingEntity> listings = listingService.getListingsByType(formattedType, page, size);
        return ResponseEntity.ok(listings);
    }

    // Creates a new listing. Handles mixed data types: text fields for details and file uploads for images.
    @PostMapping(consumes = {"multipart/form-data"}) 
    public ResponseEntity<ListingEntity> createListing(
            Authentication authentication,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("title") String title,
            @RequestParam("condition") String condition,
            @RequestParam("description") String description,
            @RequestParam("listingType") String listingType, 
            @RequestParam("price") Double price,
            @RequestParam("allowMeetup") Boolean allowMeetup,
            @RequestParam(value = "meetupLocation", required = false) String meetupLocation,
            @RequestParam("allowDelivery") Boolean allowDelivery,
            @RequestParam(value = "deliveryOptions", required = false) String deliveryOptions,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        // Identify the user making the request
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        Long userId = currentUser.getUserId();

        // Build the listing object from the request parameters
        ListingEntity newListing = new ListingEntity();
        newListing.setTitle(title);
        newListing.setCondition(condition);
        newListing.setDescription(description);
        newListing.setListingType(listingType);
        newListing.setPrice(price);
        newListing.setAllowMeetup(allowMeetup);
        newListing.setMeetupLocation(meetupLocation);
        newListing.setAllowDelivery(allowDelivery);
        newListing.setDeliveryOptions(deliveryOptions);

        try {
            // Save the listing and upload images via the service
            ListingEntity createdListing = listingService.createListingWithImages(
                newListing, userId, categoryId, images
            );
            return new ResponseEntity<>(createdListing, HttpStatus.CREATED);
        } catch (RuntimeException | IOException e) { 
            System.err.println("Error creating listing: " + e.getMessage());
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null); 
        }
    }

    // Updates an existing listing. This supports updating text details, adding new images, and deleting specific old images.
    @PutMapping(value = "/{listingId}", consumes = {"multipart/form-data"})
    public ResponseEntity<ListingEntity> updateListing(
            @PathVariable Long listingId,
            Authentication authentication,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("title") String title,
            @RequestParam("condition") String condition,
            @RequestParam("description") String description,
            @RequestParam("listingType") String listingType,
            @RequestParam("price") Double price,
            @RequestParam("allowMeetup") Boolean allowMeetup,
            @RequestParam(value = "meetupLocation", required = false) String meetupLocation,
            @RequestParam("allowDelivery") Boolean allowDelivery,
            @RequestParam(value = "deliveryOptions", required = false) String deliveryOptions,
            
            // List of image IDs to remove from the listing
            @RequestParam(value = "imagesToDelete", required = false) List<Long> imagesToDelete, 
            
            // New image files to add to the listing
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages
    ) {
        try {
            UserEntity currentUser = (UserEntity) authentication.getPrincipal();

            ListingEntity listingUpdateData = new ListingEntity();
            listingUpdateData.setTitle(title);
            listingUpdateData.setCondition(condition);
            listingUpdateData.setDescription(description);
            listingUpdateData.setListingType(listingType);
            listingUpdateData.setPrice(price);
            listingUpdateData.setAllowMeetup(allowMeetup);
            listingUpdateData.setMeetupLocation(meetupLocation);
            listingUpdateData.setAllowDelivery(allowDelivery);
            listingUpdateData.setDeliveryOptions(deliveryOptions);

            // Perform the update logic in the service
            ListingEntity updatedListing = listingService.updateListing(
                listingId,
                currentUser.getUserId(),
                categoryId,
                listingUpdateData,
                imagesToDelete, 
                newImages       
            );
            return ResponseEntity.ok(updatedListing);

        } catch (RuntimeException | IOException e) {
            System.err.println("Error updating listing: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Specific endpoint to update just the status of a listing (e.g., marking it as 'Sold')
    @PutMapping("/{listingId}/status")
    public ResponseEntity<Void> updateListingStatus(
            @PathVariable Long listingId,
            @RequestParam String status,
            Authentication authentication
    ) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        try {
            listingService.updateListingStatus(listingId, status, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Permanently deletes a listing. Ensures the user owns the listing before deleting.
    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> deleteListing(
            @PathVariable Long listingId, 
            Authentication authentication
    ) {
        try {
            UserEntity currentUser = (UserEntity) authentication.getPrincipal();

            listingService.deleteListing(listingId, currentUser.getUserId()); 

            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            System.err.println("Error deleting listing: " + e.getMessage());
             if (e instanceof AccessDeniedException) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}