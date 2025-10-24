package com.edurent.crc.repository;

import com.edurent.crc.entity.UserEntity; // Updated
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> { // Updated
    Optional<UserEntity> findByEmail(String email); // Updated
    Optional<UserEntity> findByStudentIdNumber(String studentIdNumber); // Updated
}

