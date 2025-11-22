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
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.edurent.crc.repository.UserRepository;
import com.edurent.crc.security.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private UserRepository userRepository;

    @SuppressWarnings("removal")
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Disable CSRF (Not needed for JWT)
            .csrf(csrf -> csrf.disable())
            
            // 2. Use our custom CORS Configuration Bean
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // [NEW] Debug why access is denied
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, authException) -> {
                    System.out.println("⚠️ SECURITY BLOCK (401): " + authException.getMessage());
                    response.sendError(401, authException.getMessage());
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    System.out.println("⚠️ SECURITY BLOCK (403): " + accessDeniedException.getMessage());
                    response.sendError(403, "Access Denied: " + accessDeniedException.getMessage());
                })
            )
            
            .authorizeHttpRequests(authz -> authz
                // --- Public Endpoints ---
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/schools/**").permitAll()
                .requestMatchers("/api/v1/categories/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/listing-images/**").permitAll()
                
                // This forces a simple path match, bypassing strict MVC matcher issues
                .requestMatchers("/api/v1/conversations/{id}/messages/upload-image").permitAll()

                // --- Private Endpoints ---
                .requestMatchers("/api/v1/conversations/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // --- 3. Dedicated CORS Bean  ---
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Explicitly allow your Frontend URL (Better than "*" for credentials)
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000")); 
        
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
    }
}