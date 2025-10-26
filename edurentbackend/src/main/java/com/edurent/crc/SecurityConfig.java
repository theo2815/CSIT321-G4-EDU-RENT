package com.edurent.crc;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import com.edurent.crc.repository.UserRepository;
import com.edurent.crc.security.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired // Inject UserRepository
    private UserRepository userRepository;

    // This is the main security "rulebook"
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (Cross-Site Request Forgery) - not needed for stateless API
            .csrf(csrf -> csrf.disable())
            
            // Enable CORS (Cross-Origin Resource Sharing)
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173")); // Allow React dev server
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                return config;
            }))
            
            // Define which endpoints are public vs. private
            .authorizeHttpRequests(authz -> authz
                // These endpoints are public (no token required)
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/schools/**").permitAll() // Example: letting users see schools before login
                .requestMatchers("/api/v1/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/listing-images/**").permitAll()

                // All other requests must be authenticated
                .anyRequest().authenticated()
            )
            
            // We are using JWTs, so we don't need to manage sessions
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Add our custom JWT filter *before* the default username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Expose the PasswordEncoder bean for our UserService to use
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Expose the AuthenticationManager bean for our login endpoint
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username) // Use email as username
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        // Note: We are returning the UserEntity directly because it implements UserDetails
    }
}

