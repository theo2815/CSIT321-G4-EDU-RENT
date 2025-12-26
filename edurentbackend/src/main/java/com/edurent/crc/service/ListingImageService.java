package com.edurent.crc.service;

import org.springframework.lang.NonNull;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.ListingImageEntity;
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

    public List<ListingImageEntity> getImagesForListing(@NonNull Long listingId) {
        return listingImageRepository.findByListingId(listingId);
    }

    public ListingImageEntity addImageToListing(ListingImageEntity image, @NonNull Long listingId) {
        ListingEntity listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));

        image.setListing(listing);
        return listingImageRepository.save(image);
    }

    public void deleteImage(@NonNull Long imageId) {
        listingImageRepository.deleteById(imageId);
    }
}
