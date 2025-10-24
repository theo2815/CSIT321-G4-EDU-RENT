package com.edurent.crc.service;

import com.edurent.crc.entity.ListingEntity; // Updated
import com.edurent.crc.entity.TransactionEntity; // Updated
import com.edurent.crc.entity.UserEntity; // Updated
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.TransactionRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    public List<TransactionEntity> getAllTransactions() { // Updated
        return transactionRepository.findAll();
    }

    public Optional<TransactionEntity> getTransactionById(Long id) { // Updated
        return transactionRepository.findById(id);
    }
    
    public List<TransactionEntity> getTransactionsByBuyerId(Long buyerId) { // Updated
        return transactionRepository.findByBuyerId(buyerId);
    }

    public TransactionEntity createTransaction(TransactionEntity transaction, Long listingId, Long buyerId) { // Updated
        ListingEntity listing = listingRepository.findById(listingId) // Updated
                .orElseThrow(() -> new RuntimeException("Listing not found with id: " + listingId));
        
        UserEntity buyer = userRepository.findById(buyerId) // Updated
                .orElseThrow(() -> new RuntimeException("Buyer not found with id: " + buyerId));
        
        UserEntity seller = listing.getUser(); // Updated

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
}

