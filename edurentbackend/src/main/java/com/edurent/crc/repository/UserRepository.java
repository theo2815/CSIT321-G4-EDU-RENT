package com.edurent.crc.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByStudentIdNumber(String studentIdNumber);

    Optional<UserEntity> findByUsername(String username);

    /**
     * Find user by username with school eagerly loaded.
     * Uses @EntityGraph instead of JOIN FETCH for cleaner code.
     */
    @EntityGraph(value = "User.withSchool")
    Optional<UserEntity> findWithSchoolByUsername(String username);

    /**
     * Find user by ID with school eagerly loaded.
     * Uses @EntityGraph instead of JOIN FETCH for cleaner code.
     */
    @EntityGraph(value = "User.withSchool")
    Optional<UserEntity> findWithSchoolByUserId(Long userId);
}
