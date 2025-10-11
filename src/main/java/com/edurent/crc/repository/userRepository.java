package com.edurent.crc.repository;

import com.edurent.crc.entity.userEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface userRepository extends JpaRepository<userEntity, Long> {
    // Spring automatically provides methods like save(), findAll(), findById(), etc.

    Optional<userEntity> findByEmail(String email);
}
