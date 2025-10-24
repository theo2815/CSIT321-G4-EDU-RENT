package com.edurent.crc.controller;

import com.edurent.crc.entity.ListingImageEntity; // Updated
import com.edurent.crc.service.ListingImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/listings/{listingId}/images")
@CrossOrigin(origins = "*")
public class ListingImageController {

    @Autowired
    private ListingImageService listingImageService;

    @GetMapping
    public List<ListingImageEntity> getImagesForListing(@PathVariable Long listingId) { // Updated
        return listingImageService.getImagesForListing(listingId);
    }

    @PostMapping
    public ResponseEntity<ListingImageEntity> addImage(@RequestBody ListingImageEntity image, // Updated
                                                 @PathVariable Long listingId) {
        try {
            ListingImageEntity newImage = listingImageService.addImageToListing(image, listingId); // Updated
            return new ResponseEntity<>(newImage, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long listingId, 
                                            @PathVariable Long imageId) {
        listingImageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}

