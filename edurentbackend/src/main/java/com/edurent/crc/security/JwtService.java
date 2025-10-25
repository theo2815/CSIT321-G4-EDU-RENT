package com.edurent.crc.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import com.edurent.crc.entity.UserEntity;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    // !!! IMPORTANT !!!
    // REPLACE THIS with your own 32-byte (64-character hex) secret key.
    // You can generate one here: https://www.allkeysgenerator.com/Random/Security-Key-Generator.aspx (use 256-bit)
    private static final String SECRET_KEY = "2cfa00c56ea9fdf997275b9c3e846b3147c890895084b5814960d50c0d570fec";
    
    // Token validity (e.g., 24 hours)
    private static final long JWT_TOKEN_VALIDITY = 1000 * 60 * 60 * 24;

    // 1. Generate Token for a user
    public String generateToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        // You can add more claims here (e.g., roles)
        claims.put("userId", user.getUserId());
        claims.put("fullName", user.getFullName());
        
        return createToken(claims, user.getEmail());
    }

    // 2. Create the token
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject) // The "subject" is the user's email (unique identifier)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 3. Get the signing key
    private Key getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
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
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // 9. Validate token (check if username matches and token is not expired)
    public Boolean validateToken(String token, UserEntity user) {
        final String username = extractUsername(token);
        return (username.equals(user.getEmail()) && !isTokenExpired(token));
    }
}

