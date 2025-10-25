package com.edurent.crc.security;

import com.edurent.crc.entity.UserEntity;
import com.edurent.crc.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 1. Check if the Authorization header is present and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract the token from the header
        jwt = authHeader.substring(7); // "Bearer ".length()

        try {
            // 3. Extract the email from the token
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            // If token is invalid, send an unauthorized response
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT Token");
            return;
        }


        // 4. If email is extracted and user is not already authenticated
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // 5. Load the user from the database
            // Note: We are using UserEntity directly as UserDetails for simplicity.
            // A better practice is a dedicated UserDetailsService.
            UserEntity user = this.userRepository.findByEmail(userEmail)
                    .orElse(null);

            // 6. Validate the token
            if (user != null && jwtService.validateToken(jwt, user)) {
                
                // 7. Create the authentication token
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        user, // We use the whole UserEntity as the principal
                        null,
                        user.getAuthorities() // Use authorities from UserEntity
                );
                
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                
                // 8. Set the authentication in the SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // 9. Continue the filter chain
        filterChain.doFilter(request, response);
    }
}

