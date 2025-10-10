package com.edurent.crc.service;

import com.edurent.crc.entity.productEntity;
import com.edurent.crc.repository.productRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class productService {

    @Autowired
    private productRepository productRepository;

    // This is the main method for the marketplace view!
    public List<productEntity> findAllProducts() {
        return productRepository.findAll();
    }
    
    // Add logic for adding a product: public ProductEntity saveProduct(ProductEntity product) { ... }
}
