package com.edurent.crc.repository;

import com.edurent.crc.entity.productEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface productRepository extends JpaRepository<productEntity, Long> {
    // We can add a custom method here later, like finding products by seller ID!
    // List<ProductEntity> findBySellerId(Long sellerId); 
}
