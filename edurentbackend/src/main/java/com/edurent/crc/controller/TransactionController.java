package com.edurent.crc.controller;

import com.edurent.crc.entity.TransactionEntity; // Updated
import com.edurent.crc.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public List<TransactionEntity> getAllTransactions() { // Updated
        return transactionService.getAllTransactions();
    }
    
    @GetMapping("/buyer/{buyerId}")
    public List<TransactionEntity> getTransactionsByBuyer(@PathVariable Long buyerId) { // Updated
        return transactionService.getTransactionsByBuyerId(buyerId);
    }

    @PostMapping
    public ResponseEntity<TransactionEntity> createTransaction(@RequestBody TransactionEntity transaction, // Updated
                                                         @RequestParam Long listingId,
                                                         @RequestParam Long buyerId) {
        try {
            TransactionEntity newTransaction = transactionService.createTransaction(transaction, listingId, buyerId); // Updated
            return new ResponseEntity<>(newTransaction, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

