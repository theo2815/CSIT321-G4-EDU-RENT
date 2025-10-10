package com.edurent.crc.controller;

import com.edurent.crc.entity.rentalEntity;
import com.edurent.crc.service.rentalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/rentals")
@CrossOrigin(origins = "http://localhost:3000")
public class rentalController {

    @Autowired
    private rentalService rentalService;

    @GetMapping 
    public List<rentalEntity> getAllRentals() {
        return rentalService.findAllRentals();
    }
}
