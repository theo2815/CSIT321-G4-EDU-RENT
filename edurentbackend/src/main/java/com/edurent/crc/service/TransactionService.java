package com.edurent.crc.service;

import java.util.Date;
import java.util.List; 
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.TransactionRepository;
import com.edurent.crc.repository.UserRepository;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    public List<TransactionEntity> getAllTransactions() { 
        return transactionRepository.findAll();
    }

    public Optional<TransactionEntity> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }
    
    public List<TransactionEntity> getTransactionsByBuyerId(Long buyerId) { 
        return transactionRepository.findByBuyerId(buyerId);
    }

    @Transactional 
    public TransactionEntity createTransaction(TransactionEntity transaction, Long listingId, Long buyerId) { 
        ListingEntity listing = listingRepository.findById(listingId) 
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        UserEntity buyer = userRepository.findById(buyerId) 
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        
        UserEntity seller = listing.getUser();

        if (buyer.getUserId().equals(seller.getUserId())) {
            throw new IllegalStateException("Buyer and Seller cannot be the same person.");
        }

        listing.setStatus(transaction.getTransactionType().equals("Sale") ? "Sold" : "Rented");
        listingRepository.save(listing);

        transaction.setListing(listing);
        transaction.setBuyer(buyer);
        transaction.setSeller(seller);
        
        return transactionRepository.save(transaction);
    }

    // --- NEW: Update Rental Dates ---
    public TransactionEntity updateRentalDates(Long transactionId, Date startDate, Date endDate) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        transaction.setStartDate(startDate);
        transaction.setEndDate(endDate);

        return transactionRepository.save(transaction);
    }

    // --- NEW: Mark Rental as Returned (Available) ---
    @org.springframework.transaction.annotation.Transactional
    public void completeRental(Long transactionId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        ListingEntity listing = transaction.getListing();

        // 1. Revert listing status to Available
        listing.setStatus("Available");
        listingRepository.save(listing);

        // 2. Mark transaction as Completed
        transaction.setStatus("Completed");
        // We set end date to "now" to reflect early return? 
        transaction.setEndDate(new Date()); 
        transactionRepository.save(transaction);

    } 

    // --- NEW: Helper to find active transaction by listing ---
    public Optional<TransactionEntity> getActiveTransactionByListing(Long listingId) {
        return transactionRepository.findLatestByListingId(listingId);
    }
}

