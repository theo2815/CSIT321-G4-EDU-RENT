package com.edurent.crc.controller;

import com.edurent.crc.entity.ListingEntity; // Updated
import com.edurent.crc.service.ListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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

    @GetMapping("/user/{userId}")
    public List<ListingEntity> getListingsByUserId(@PathVariable Long userId) { // Updated
        return listingService.getListingsByUserId(userId);
    }
    
    @GetMapping("/category/{categoryId}")
    public List<ListingEntity> getListingsByCategoryId(@PathVariable Long categoryId) { // Updated
        return listingService.getListingsByCategoryId(categoryId);
    }

    @PostMapping
    public ResponseEntity<ListingEntity> createListing(@RequestBody ListingEntity listing, // Updated
                                                 @RequestParam Long userId, 
                                                 @RequestParam Long categoryId) {
        try {
            ListingEntity newListing = listingService.createListing(listing, userId, categoryId); // Updated
            return new ResponseEntity<>(newListing, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        listingService.deleteListing(id);
        return ResponseEntity.noContent().build();
    }
}

