package com.edurent.crc.controller;

import org.springframework.lang.NonNull;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edurent.crc.entity.TransactionEntity;
import com.edurent.crc.service.TransactionService;
import com.edurent.crc.service.RentalSchedulerService;

@RestController
@RequestMapping("/api/v1/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private RentalSchedulerService rentalSchedulerService;

    // Test Endpoint
    @PostMapping("/test-scheduler")
    public ResponseEntity<String> triggerSchedulerManually() {
        rentalSchedulerService.checkExpiredRentals();
        return ResponseEntity.ok("Scheduler triggered manually!");
    }

    @GetMapping
    public List<TransactionEntity> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/buyer/{buyerId}")
    public List<TransactionEntity> getTransactionsByBuyer(@PathVariable @NonNull Long buyerId) {
        return transactionService.getTransactionsByBuyerId(buyerId);
    }

    @PostMapping
    public ResponseEntity<TransactionEntity> createTransaction(@RequestBody TransactionEntity transaction,
            @RequestParam @NonNull Long listingId,
            @RequestParam @NonNull Long buyerId) {
        try {
            TransactionEntity newTransaction = transactionService.createTransaction(transaction, listingId, buyerId);
            return new ResponseEntity<>(newTransaction, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // --- NEW: Get Active Transaction for a Listing ---
    @GetMapping("/listing/{listingId}")
    public ResponseEntity<TransactionEntity> getTransactionByListing(@PathVariable @NonNull Long listingId) {
        return transactionService.getActiveTransactionByListing(listingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- NEW: Edit Rental Dates ---
    @PutMapping("/{transactionId}/dates")
    public ResponseEntity<TransactionEntity> updateRentalDates(
            @PathVariable @NonNull Long transactionId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        try {
            TransactionEntity updated = transactionService.updateRentalDates(transactionId, startDate, endDate);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // --- NEW: Mark as Returned (Complete Rental) ---
    @PutMapping("/{transactionId}/return")
    public ResponseEntity<Void> completeRental(@PathVariable @NonNull Long transactionId) {
        try {
            transactionService.completeRental(transactionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
