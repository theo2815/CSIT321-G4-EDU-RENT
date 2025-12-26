package com.edurent.crc.service;

import org.springframework.lang.NonNull;
import java.util.Objects;

import com.edurent.crc.entity.PasswordResetTokenEntity;
import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.PasswordResetTokenRepository;
import com.edurent.crc.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final int TOKEN_EXPIRY_MINUTES = 30;

    /**
     * Request password reset - generates token and sends email
     */
    @Transactional
    public void requestPasswordReset(String email) {
        // Find user by email - if not found, silently return to avoid account
        // enumeration
        UserEntity user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Don't reveal that the email doesn't exist - security best practice
            System.out.println("⚠️ Password reset requested for non-existent email: " + email);
            return;
        }

        // Invalidate any existing unused tokens for this user
        invalidateExistingTokens(Objects.requireNonNull(user.getUserId()));

        // Generate new token
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(TOKEN_EXPIRY_MINUTES));

        // Save token to database
        PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity(
                user.getUserId(),
                token,
                expiresAt);
        tokenRepository.save(resetToken);

        // Send email
        try {
            mailService.sendPasswordResetEmail(user.getEmail(), token, user.getFullName());
            System.out.println("✅ Password reset token created for user: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Failed to send reset email: " + e.getMessage());
            // Delete the token if email fails
            tokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to send reset email. Please try again later.");
        }
    }

    /**
     * Reset password using token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Validate input
        if (token == null || token.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token is required");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 6 characters long");
        }

        // Find token
        PasswordResetTokenEntity resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid or expired reset token"));

        // Check if token is already used
        if (resetToken.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This reset token has already been used");
        }

        // Check if token is expired
        if (resetToken.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Reset token has expired. Please request a new one");
        }

        // Find user
        UserEntity user = userRepository.findById(Objects.requireNonNull(resetToken.getUserId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not found"));

        // Update password (hash it)
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Invalidate any other unused tokens for this user
        invalidateExistingTokens(Objects.requireNonNull(user.getUserId()));

        System.out.println("✅ Password successfully reset for user: " + user.getEmail());
    }

    /**
     * Invalidate all existing unused tokens for a user
     */
    private void invalidateExistingTokens(@NonNull Long userId) {
        List<PasswordResetTokenEntity> existingTokens = tokenRepository
                .findByUserIdAndUsedFalseAndExpiresAtAfter(userId, Instant.now());

        for (PasswordResetTokenEntity token : existingTokens) {
            token.setUsed(true);
            tokenRepository.save(token);
        }

        if (!existingTokens.isEmpty()) {
            System.out.println("🔒 Invalidated " + existingTokens.size() + " existing tokens for user ID: " + userId);
        }
    }

    /**
     * Validate if a token is valid (exists, not expired, not used)
     */
    public boolean isTokenValid(String token) {
        return tokenRepository.findByToken(token)
                .map(PasswordResetTokenEntity::isValid)
                .orElse(false);
    }

    /**
     * Cleanup expired tokens - can be called periodically
     */
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiresAtBefore(Instant.now());
        System.out.println("🧹 Cleaned up expired password reset tokens");
    }
}
