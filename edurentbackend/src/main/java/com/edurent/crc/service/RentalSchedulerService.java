package com.edurent.crc.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.TransactionRepository;
import com.edurent.crc.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Calendar;

@Service
public class RentalSchedulerService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private ListingRepository listingRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // Run every hour.
    @Scheduled(cron = "0 0 * * * *") 
    //@Scheduled(fixedRate = 10000)
    @Transactional
    public void sendReturnReminders() {
        // Calculate "Today" range
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0); cal.set(Calendar.MINUTE, 0); cal.set(Calendar.SECOND, 0);
        Date startOfDay = cal.getTime();
        
        cal.set(Calendar.HOUR_OF_DAY, 23); cal.set(Calendar.MINUTE, 59); cal.set(Calendar.SECOND, 59);
        Date endOfDay = cal.getTime();

        System.out.println("⏳ Scheduler: Sending reminders for rentals ending between " + startOfDay + " and " + endOfDay);

        List<TransactionEntity> dueTransactions = transactionRepository.findRentalsEndingBetween(startOfDay, endOfDay);

        for (TransactionEntity t : dueTransactions) {
            try {
                // Prevent duplicate reminders if needed (optional logic could go here)
                
                NotificationEntity notification = new NotificationEntity();
                notification.setUser(t.getBuyer()); // Notify Renter
                notification.setType("RENTAL_REMINDER");
                notification.setLinkUrl("/listing/" + t.getListing().getListingId());

                String formattedStart = t.getStartDate().toString().split(" ")[0]; // Simple formatting
                String formattedEnd = t.getEndDate().toString().split(" ")[0];

                String content = String.format("Reminder: Your rental period is from <strong>%s</strong> to <strong>%s</strong>. Kindly return the rented item to the seller upon completion. Thank you.", 
                                             formattedStart, formattedEnd);
                
                notification.setContent(content);
                notification.setCreatedAt(LocalDateTime.now());
                notification.setIsRead(false);

                NotificationEntity saved = notificationRepository.save(notification);
                messagingTemplate.convertAndSend("/topic/user." + t.getBuyer().getUserId(), saved);
                
            } catch (Exception e) {
                System.err.println("Failed to send reminder for txn " + t.getTransactionId() + ": " + e.getMessage());
            }
        }
    }

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