package com.edurent.crc.repository;

import com.edurent.crc.entity.rentalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface rentalRepository extends JpaRepository<rentalEntity, Long> {
    
}
