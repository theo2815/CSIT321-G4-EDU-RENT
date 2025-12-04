package com.edurent.crc.repository;

import com.edurent.crc.entity.PasswordResetTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, Long> {
    
    Optional<PasswordResetTokenEntity> findByToken(String token);
    
    List<PasswordResetTokenEntity> findByUserId(Long userId);
    
    // Find all valid (unused and not expired) tokens for a user
    List<PasswordResetTokenEntity> findByUserIdAndUsedFalseAndExpiresAtAfter(Long userId, Instant now);
    
    // Delete expired tokens (for cleanup)
    void deleteByExpiresAtBefore(Instant now);
}
