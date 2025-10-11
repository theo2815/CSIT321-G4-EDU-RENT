package com.edurent.crc.controller;

import com.edurent.crc.entity.transactionEntity;
import com.edurent.crc.service.transactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class transactionController {

    @Autowired
    private transactionService transactionService;

    @GetMapping 
    public List<transactionEntity> getAllTransactions() {
        return transactionService.findAllTransactions();
    }
}
