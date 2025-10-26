package com.edurent.crc.repository;

import com.edurent.crc.entity.CategoryEntity; // Updated
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> { // Updated
    Optional<CategoryEntity> findByName(String name); // Updated
}

