package com.edurent.crc.controller;

import java.io.IOException; // Updated
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

    @GetMapping
    public List<ListingEntity> getAllListings() { // Updated
        return listingService.getAllListings();
    }

    // <--- MODIFIED: Standardized to /{listingId} for consistency --->
    @GetMapping("/{listingId}") 
    public ResponseEntity<ListingEntity> getListingById(@PathVariable Long listingId) { // <--- MODIFIED: Renamed 'id' to 'listingId'
        return listingService.getListingById(listingId) // <--- MODIFIED: Renamed 'id' to 'listingId'
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- NEW Endpoint: Get Listings by User ID ---
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ListingEntity>> getListingsByUserId(@PathVariable Long userId) {
        // We need a corresponding method in ListingService
        List<ListingEntity> listings = listingService.getListingsByUserId(userId);
        // Return OK even if list is empty
        return ResponseEntity.ok(listings);
    }
    
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ListingEntity>> getListingsByCategoryId(@PathVariable Long categoryId) {
        // We already created this method in ListingService
        List<ListingEntity> listings = listingService.getListingsByCategoryId(categoryId);
        if (listings.isEmpty()) {
            return ResponseEntity.noContent().build(); // Or OK with empty list
        }
        return ResponseEntity.ok(listings);
    }

    // --- UPDATED createListing Endpoint ---
    @PostMapping(consumes = {"multipart/form-data"}) // Specify content type
    public ResponseEntity<ListingEntity> createListing(
            // Get user from JWT token
            Authentication authentication,
            // Use @RequestParam for form fields
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("title") String title,
            @RequestParam("condition") String condition,
            @RequestParam("description") String description,
            @RequestParam("listingType") String listingType, // e.g., "For Sale", "For Rent"
            @RequestParam("price") Double price,
            @RequestParam("allowMeetup") Boolean allowMeetup,
            @RequestParam(value = "meetupLocation", required = false) String meetupLocation,
            @RequestParam("allowDelivery") Boolean allowDelivery,
            @RequestParam(value = "deliveryOptions", required = false) String deliveryOptions,
            // Use @RequestPart for files (optional)
            @RequestPart(value = "images", required = false) List<MultipartFile> images
            // Add @RequestParam for rentPeriod if needed
            // @RequestParam(value = "rentPeriod", required = false) String rentPeriod
    ) {
        // 1. Get User ID from Authentication
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        Long userId = currentUser.getUserId();

        // 2. Create ListingEntity object from request params
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
        // newListing.setRentPeriod(rentPeriod); // If applicable

        try {
            // 3. Call service (pass user ID, category ID, listing object, and files)
            //    We need to update the service method signature too.
            ListingEntity createdListing = listingService.createListingWithImages(
                newListing, userId, categoryId, images
            );
            return new ResponseEntity<>(createdListing, HttpStatus.CREATED);
        } catch (RuntimeException | IOException e) { // Catch potential IO errors from file handling
            // Log the error for debugging
             System.err.println("Error creating listing: " + e.getMessage());
             e.printStackTrace(); // Print stack trace
            // Return appropriate error response
            // Consider creating a specific ErrorResponse DTO
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null); // Or Internal Server Error
        }
    }
    // --- End UPDATED createListing ---

    // <--- NEW: Endpoint to UPDATE a listing --->
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
            
            // --- NEW PARAMETER ---
            @RequestParam(value = "imagesToDelete", required = false) List<Long> imagesToDelete, 
            
            // Renamed for clarity
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

            // Call the updated service method
            ListingEntity updatedListing = listingService.updateListing(
                listingId,
                currentUser.getUserId(),
                categoryId,
                listingUpdateData,
                imagesToDelete, // <-- Pass the new list
                newImages       // <-- Pass the new files
            );
            return ResponseEntity.ok(updatedListing);

        } catch (RuntimeException | IOException e) {
            System.err.println("Error updating listing: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
    // --- End UPDATED Endpoint ---

    // --- NEW: Update Status Endpoint ---
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
    

    // <--- MODIFIED: Updated error handling --->
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
             // Check for specific security exception
             if (e instanceof AccessDeniedException) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            // Fallback for other errors (e.g., Not Found)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

