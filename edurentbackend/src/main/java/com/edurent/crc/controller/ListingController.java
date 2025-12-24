package com.edurent.crc.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
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

    // Retrieves a list of all available listings (Hides Inactive by default)
    @GetMapping
    public Page<ListingEntity> getAllListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return listingService.getAllListings(page, size);
    }

    // Fetches a single listing by ID
    @GetMapping("/{listingId}")
    public ResponseEntity<ListingEntity> getListingById(@PathVariable Long listingId) {
        return listingService.getListingById(listingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Retrieves listings for a specific user.
    // 'includeInactive' param allows fetching private/inactive items (e.g., for
    // Manage Listings page)
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<ListingEntity>> getListingsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @RequestParam(required = false) String statusGroup, // "active", "sold", or null (default)
            @RequestParam(required = false) String listingType // "rent", "sale" or null
    ) {
        Page<ListingEntity> listings = listingService.getListingsByUserId(userId, page, size, includeInactive,
                statusGroup, listingType);
        return ResponseEntity.ok(listings);
    }

    // Retrieves listings by category
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ListingEntity>> getListingsByCategoryId(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ListingEntity> listings = listingService.getListingsByCategoryId(categoryId, page, size);
        if (listings.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(listings);
    }

    // Filters listings by type (Rent/Sale)
    @GetMapping("/type/{listingType}")
    public ResponseEntity<Page<ListingEntity>> getListingsByType(
            @PathVariable String listingType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String formattedType = listingType.equalsIgnoreCase("rent") ? "For Rent"
                : listingType.equalsIgnoreCase("sale") ? "For Sale" : listingType;

        Page<ListingEntity> listings = listingService.getListingsByType(formattedType, page, size);
        return ResponseEntity.ok(listings);
    }

    // Creates a new listing with image upload support
    @PostMapping(consumes = { "multipart/form-data" })
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
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        UserEntity currentUser = (UserEntity) authentication.getPrincipal();
        Long userId = currentUser.getUserId();

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
            ListingEntity createdListing = listingService.createListingWithImages(
                    newListing, userId, categoryId, images);
            return new ResponseEntity<>(createdListing, HttpStatus.CREATED);
        } catch (RuntimeException | IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Updates an existing listing (supports text updates, adding new images, and
    // deleting old ones)
    @PutMapping(value = "/{listingId}", consumes = { "multipart/form-data" })
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
            @RequestParam(value = "imagesToDelete", required = false) List<Long> imagesToDelete,
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages) {
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

            ListingEntity updatedListing = listingService.updateListing(
                    listingId,
                    currentUser.getUserId(),
                    categoryId,
                    listingUpdateData,
                    imagesToDelete,
                    newImages);
            return ResponseEntity.ok(updatedListing);

        } catch (RuntimeException | IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Updates only the status of a listing (e.g., Active -> Sold, Active ->
    // Inactive)
    @PutMapping("/{listingId}/status")
    public ResponseEntity<Void> updateListingStatus(
            @PathVariable Long listingId,
            @RequestParam String status,
            Authentication authentication) {
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

    // Permanently deletes a listing and its associated images
    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> deleteListing(
            @PathVariable Long listingId,
            Authentication authentication) {
        try {
            UserEntity currentUser = (UserEntity) authentication.getPrincipal();
            listingService.deleteListing(listingId, currentUser.getUserId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e instanceof AccessDeniedException) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}