package com.edurent.crc.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.TransactionRepository;

@Service
public class RentalSchedulerService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ListingRepository listingRepository;

    // Run every hour. 
    @Scheduled(cron = "0 0 * * * *") 
    @Transactional
    public void checkExpiredRentals() {
        Date now = new Date();
        System.out.println("⏳ Scheduler running: Checking for rentals expired before " + now);
        
        List<TransactionEntity> expiredTransactions = transactionRepository.findExpiredRentals(now);

        for (TransactionEntity transaction : expiredTransactions) {
            ListingEntity listing = transaction.getListing();
            
            // 1. Revert listing status to Available
            if (listing != null) {
                listing.setStatus("Available");
                listingRepository.save(listing);
                System.out.println("   -> Item '" + listing.getTitle() + "' is now Available.");
            }
            
            // 2. Mark transaction as Completed
            transaction.setStatus("Completed");
            transactionRepository.save(transaction);
        }
    }
}