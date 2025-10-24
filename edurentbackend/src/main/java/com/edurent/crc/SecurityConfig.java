package com.edurent.crc;

    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.security.config.annotation.web.builders.HttpSecurity;
    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.security.web.SecurityFilterChain;
    import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

    @Configuration
    public class SecurityConfig implements WebMvcConfigurer {

        @Bean
        public PasswordEncoder passwordEncoder() {
            // Use BCrypt for strong, modern password hashing
            return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            // This is a basic configuration.
            // It DISABLES the default login page and allows all API requests.
            // This is OK for now so your frontend can connect.
            http
                .csrf(csrf -> csrf.disable()) // Disable CSRF for now
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/v1/**").permitAll() // Allow all API endpoints
                    .anyRequest().authenticated()
                );
            return http.build();
        }
    }
    
