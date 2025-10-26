package com.edurent.crc.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest; // Import Logger
import jakarta.servlet.http.HttpServletResponse; // Import LoggerFactory

import com.edurent.crc.entity.UserEntity; // Ensure UserEntity is imported
import io.jsonwebtoken.ExpiredJwtException; // Import specific exceptions
import io.jsonwebtoken.JwtException; // Import base JWT exception

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserRepository userRepository;

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        log.info("JwtAuthFilter processing request for: {}", request.getRequestURI());

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Authorization header missing or does not start with Bearer for {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        log.debug("Extracted JWT: {}", jwt); // Use DEBUG for potentially sensitive info

        try {
            userEmail = jwtService.extractUsername(jwt);
            log.info("Extracted email from JWT: {}", userEmail);

            // --- ADDED: Check for expiration explicitly here ---
            if (jwtService.isTokenExpired(jwt)) {
                log.warn("JWT token is expired for email: {}", userEmail);
                // Let the validation fail later, or send 401 immediately
                // response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                // response.getWriter().write("JWT Token Expired");
                // return;
            }
            // ---------------------------------------------------

        } catch (ExpiredJwtException eje) { // Catch specific expiration exception
             log.warn("JWT token is expired: {}", eje.getMessage());
             response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
             response.getWriter().write("JWT Token Expired");
             return;
        } catch (JwtException | IllegalArgumentException e) { // Catch other JWT errors
            log.error("Error processing JWT: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid JWT Token");
            return;
        } catch (Exception e) { // Catch unexpected errors
             log.error("Unexpected error during JWT email extraction: {}", e.getMessage(), e); // Log stack trace
             response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
             response.getWriter().write("Internal server error during token processing");
             return;
        }


        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            log.info("User {} is not yet authenticated, attempting to load.", userEmail);

            // --- ADDED: Log user loading ---
            UserEntity user = null;
            try {
                user = this.userRepository.findByEmail(userEmail)
                    .orElse(null); // Keep orElse(null) for now

                if (user == null) {
                    log.warn("User not found in database for email: {}", userEmail);
                } else {
                     log.info("User found in database: ID={}, Email={}", user.getUserId(), user.getEmail());
                     // --- ADDED: Log authorities ---
                     log.debug("User authorities: {}", user.getAuthorities());
                }
            } catch (Exception e) {
                 log.error("Error loading user from database for email {}: {}", userEmail, e.getMessage(), e);
                 // Decide how to handle DB error - maybe let filter chain continue and rely on later checks, or return 500
            }
            // -----------------------------


            // --- ADDED: Log token validation step ---
            boolean isTokenValid = false;
            if (user != null) {
                 try {
                     isTokenValid = jwtService.validateToken(jwt, user);
                     log.info("JWT token validation result for user {}: {}", userEmail, isTokenValid);
                 } catch (Exception e) {
                     log.error("Error during JWT validation for user {}: {}", userEmail, e.getMessage(), e);
                     isTokenValid = false; // Treat error as invalid
                 }
            }
            // ------------------------------------

            if (isTokenValid) { // Use the variable
                log.info("Proceeding to set Authentication context for user: {}", userEmail);
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        user.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.info("Authentication successfully set in SecurityContext for user: {}", userEmail);
            } else {
                 log.warn("Token validation failed or user not found for email {}, authentication not set.", userEmail);
            }
        } else {
             if (userEmail == null) { log.warn("User email is null after extraction attempt."); }
             else { log.info("User {} already authenticated, filter passes through.", userEmail); }
        }

        filterChain.doFilter(request, response);
        log.debug("JwtAuthFilter finished processing for: {}", request.getRequestURI()); // Log end
    }
}