package com.edurent.crc.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByStudentIdNumber(String studentIdNumber);

    Optional<UserEntity> findByUsername(String username);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.school WHERE u.username = :username")
    Optional<UserEntity> findByUsernameWithSchool(@Param("username") String username);

    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.school WHERE u.userId = :id")
    Optional<UserEntity> findByIdWithSchool(@Param("id") Long id);
}
