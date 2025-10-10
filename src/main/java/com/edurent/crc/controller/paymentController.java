package com.edurent.crc.controller;

import com.edurent.crc.entity.paymentEntity;
import com.edurent.crc.service.paymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:3000")
public class paymentController {

    @Autowired
    private paymentService paymentService;

    @GetMapping 
    public List<paymentEntity> getAllPayments() {
        return paymentService.findAllPayments();
    }
}