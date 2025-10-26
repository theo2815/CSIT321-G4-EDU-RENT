package com.edurent.crc.repository;

import java.util.Optional; // Updated

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> { // Updated
    Optional<UserEntity> findByEmail(String email); // Updated
    Optional<UserEntity> findByStudentIdNumber(String studentIdNumber); // Updated
}

