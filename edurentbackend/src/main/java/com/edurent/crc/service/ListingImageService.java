package com.edurent.crc.service;

import com.edurent.crc.entity.ListingEntity; // Updated
import com.edurent.crc.entity.ListingImageEntity; // Updated
import com.edurent.crc.repository.ListingImageRepository;
import com.edurent.crc.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ListingImageService {

    @Autowired
    private ListingImageRepository listingImageRepository;

    @Autowired
    private ListingRepository listingRepository;

    public List<ListingImageEntity> getImagesForListing(Long listingId) { // Updated
        return listingImageRepository.findByListingId(listingId);
    }

    public ListingImageEntity addImageToListing(ListingImageEntity image, Long listingId) { // Updated
        ListingEntity listing = listingRepository.findById(listingId) // Updated
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));
        
        // TODO: Add logic to upload image to a cloud storage (like Supabase Storage)
        // and set the 'imageUrl' property. For now, we assume it's passed in.

        image.setListing(listing);
        return listingImageRepository.save(image);
    }

    public void deleteImage(Long imageId) {
        listingImageRepository.deleteById(imageId);
    }
}

