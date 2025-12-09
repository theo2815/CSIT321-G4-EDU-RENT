package com.edurent.crc.service;

import java.util.Date;
import java.util.List; 
import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.edurent.crc.entity.ListingEntity;
import com.edurent.crc.entity.NotificationEntity;
import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.ListingRepository;
import com.edurent.crc.repository.NotificationRepository;
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

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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
        
        TransactionEntity savedTransaction = transactionRepository.save(transaction);

        // Send Notification based on type
        if ("Sale".equalsIgnoreCase(savedTransaction.getTransactionType())) {
            sendSaleNotification(savedTransaction, listing, buyer, seller);
            sendSellerNotification(savedTransaction, listing, buyer, seller);
        } else if ("Rent".equalsIgnoreCase(savedTransaction.getTransactionType())) {
            sendRentNotificationToRenter(savedTransaction, listing, buyer, seller);
            sendRentNotificationToOwner(savedTransaction, listing, buyer, seller);
        }

        return savedTransaction;
    }

    // --- RENTAL NOTIFICATIONS ---

    private void sendRentNotificationToRenter(TransactionEntity transaction, ListingEntity listing, UserEntity buyer, UserEntity seller) {
        try {
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(buyer);
            notification.setType("RENTAL_STARTED_RENTER");
            notification.setLinkUrl("/listing/" + listing.getListingId()); // Opens Product Modal

            String content = String.format("<strong>%s</strong> rented this item to you. Don't forget to leave a review!", 
                                         seller.getFullName());
            notification.setContent(content);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);

            NotificationEntity savedNotif = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/user." + buyer.getUserId(), savedNotif);
        } catch (Exception e) {
            System.err.println("Failed to send renter notification: " + e.getMessage());
        }
    }

    private void sendRentNotificationToOwner(TransactionEntity transaction, ListingEntity listing, UserEntity buyer, UserEntity seller) {
        try {
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(seller);
            notification.setType("RENTAL_STARTED_OWNER");
            // Includes ?review=true to trigger the Review Modal flow we built earlier
            notification.setLinkUrl("/listing/" + listing.getListingId() + "?review=true"); 

            String content = String.format("You recently rented this item to <strong>%s</strong>. Don't forget to leave a review!", 
                                         buyer.getFullName());
            notification.setContent(content);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);

            NotificationEntity savedNotif = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/user." + seller.getUserId(), savedNotif);
        } catch (Exception e) {
            System.err.println("Failed to send owner rental notification: " + e.getMessage());
        }
    }

    private void sendSellerNotification(TransactionEntity transaction, ListingEntity listing, UserEntity buyer, UserEntity seller) {
        try {
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(seller); // Notify the Seller
            notification.setType("TRANSACTION_COMPLETED_SELLER");
            // Append query param to trigger review mode
            notification.setLinkUrl("/listing/" + listing.getListingId() + "?review=true"); 

            String content = String.format("You recently sold <strong>%s</strong> to <strong>%s</strong>. Don't forget to leave a review!", 
                                         listing.getTitle(), buyer.getFullName());
            notification.setContent(content);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);

            NotificationEntity savedNotif = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/user." + seller.getUserId(), savedNotif);
        } catch (Exception e) {
            System.err.println("Failed to send seller transaction notification: " + e.getMessage());
        }
    }

    private void sendSaleNotification(TransactionEntity transaction, ListingEntity listing, UserEntity buyer, UserEntity seller) {
        try {
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(buyer); // Notify the Buyer
            notification.setType("TRANSACTION_COMPLETED");
            notification.setLinkUrl("/listing/" + listing.getListingId()); // Link triggers the Modal

            String content = String.format("<strong>%s</strong> sold <strong>%s</strong> to you. Don't forget to leave a review!", 
                                         seller.getFullName(), listing.getTitle());
            notification.setContent(content);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setIsRead(false);

            NotificationEntity savedNotif = notificationRepository.save(notification);
            messagingTemplate.convertAndSend("/topic/user." + buyer.getUserId(), savedNotif);
        } catch (Exception e) {
            System.err.println("Failed to send transaction notification: " + e.getMessage());
        }
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

