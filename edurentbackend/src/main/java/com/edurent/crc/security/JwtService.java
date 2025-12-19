package com.edurent.crc.security;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;

import com.edurent.crc.entity.UserEntity;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    // Secret key injected from application.properties
    @org.springframework.beans.factory.annotation.Value("${jwt.secret}")
    private String secretKey;

    @PostConstruct
    public void init() {
        try {
            Base64.getDecoder().decode(secretKey);
        } catch (IllegalArgumentException e) {
            log.warn(
                    "WARNING: 'jwt.secret' is NOT a valid Base64 string. Falling back to using raw bytes. Usage of Base64 encoded secrets is recommended.");
        }
    }

    // Token validity (e.g., 24 hours)
    private static final long JWT_TOKEN_VALIDITY = 1000 * 60 * 60 * 24;

    // 1. Generate token for user
    public String generateToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("fullName", user.getFullName());

        return createToken(claims, user.getEmail());
    }

    // 2. Create the token
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 3. Get the signing key
    private Key getSigningKey() {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(secretKey);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException e) {
            // Fallback to raw bytes if secret is not Base64
            return Keys.hmacShaKeyFor(secretKey.getBytes());
        }
    }

    // 4. Extract all claims from a token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 5. Extract a specific claim
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 6. Extract username (email) from token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 7. Extract expiration date
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // 8. Check if token is expired
    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // 9. Validate token (check if username matches and token is not expired)
    public Boolean validateToken(String token, UserEntity user) {
        final String username = extractUsername(token);
        return (username.equals(user.getEmail()) && !isTokenExpired(token));
    }
}
