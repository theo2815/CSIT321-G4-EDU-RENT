package com.edurent.crc.service;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RentalSchedulerService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ListingRepository listingRepository;

    // Run every hour (cron expression: second, minute, hour, day, month, day-of-week)
    @Scheduled(cron = "0 0 * * * *") 
    @Transactional
    public void checkExpiredRentals() {
        System.out.println("⏳ Checking for expired rentals...");
        
        List<TransactionEntity> expiredTransactions = transactionRepository.findExpiredRentals();

        for (TransactionEntity transaction : expiredTransactions) {
            ListingEntity listing = transaction.getListing();
            
            // Revert listing status
            listing.setStatus("Available");
            listingRepository.save(listing);
            
            // Optional: Mark transaction as completed/closed
            transaction.setStatus("Completed");
            transactionRepository.save(transaction);
            
            System.out.println("✅ Rental expired: Item '" + listing.getTitle() + "' is now Available.");
        }
    }
}