package com.edurent.crc.controller;

import java.io.IOException; // Updated
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/{id}")
    public ResponseEntity<ListingEntity> getListingById(@PathVariable Long id) { // Updated
        return listingService.getListingById(id)
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

    @DeleteMapping("/{listingId}")
        public ResponseEntity<Void> deleteListing(@PathVariable Long listingId) {
        listingService.deleteListing(listingId);
        return ResponseEntity.noContent().build();
    }
}

