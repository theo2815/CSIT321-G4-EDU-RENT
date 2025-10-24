package com.edurent.crc.service;

import com.edurent.crc.entity.CategoryEntity; // Updated
import com.edurent.crc.entity.ListingEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.CategoryRepository;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<ListingEntity> getAllListings() { // Updated
        return listingRepository.findAll();
    }

    public Optional<ListingEntity> getListingById(Long id) { // Updated
        return listingRepository.findById(id);
    }

    public List<ListingEntity> getListingsByUserId(Long userId) { // Updated
        return listingRepository.findByUserId(userId);
    }

    public List<ListingEntity> getListingsByCategoryId(Long categoryId) { // Updated
        return listingRepository.findByCategoryId(categoryId);
    }

    public ListingEntity createListing(ListingEntity listing, Long userId, Long categoryId) { // Updated
        UserEntity user = userRepository.findById(userId) // Updated
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        CategoryEntity category = categoryRepository.findById(categoryId) // Updated
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        listing.setUser(user);
        listing.setCategory(category);
        listing.setCreatedAt(LocalDateTime.now());
        
        return listingRepository.save(listing);
    }

    public void deleteListing(Long id) {
        listingRepository.deleteById(id);
    }
}

