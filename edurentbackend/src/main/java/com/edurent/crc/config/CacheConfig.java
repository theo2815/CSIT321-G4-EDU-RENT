package com.edurent.crc.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Cache configuration using Caffeine.
 * Provides in-memory caching for frequently accessed data.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @SuppressWarnings("null")
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "listings", // Cache for listing queries
                "categories" // Cache for category data
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500) // Max 500 entries per cache
                .expireAfterWrite(10, TimeUnit.MINUTES) // Expire after 10 minutes
                .recordStats()); // Enable stats for monitoring

        return cacheManager;
    }
}
