package com.edurent.crc.controller;

import com.edurent.crc.entity.productEntity;
import com.edurent.crc.service.productService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/products") // Base URL: /api/products
@CrossOrigin(origins = "http://localhost:3000") // IMPORTANT: Allows React to talk to Spring Boot
public class productController {

    @Autowired
    private productService productService;

    // This is the main API for the marketplace!
    @GetMapping 
    public List<productEntity> getAllProducts() {
        return productService.findAllProducts();
    }
    
    // You would add a method to add a new product here: 
    // @PostMapping public ProductEntity createProduct(@RequestBody ProductEntity product) { ... }
}