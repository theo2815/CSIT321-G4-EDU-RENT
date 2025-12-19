package com.edurent.crc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class StorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private final String PROFILE_BUCKET = "profile-images";
    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void deleteProfileImageAsync(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty())
            return;

        try {
            String[] parts = imageUrl.split("/" + PROFILE_BUCKET + "/");

            if (parts.length < 2)
                return;

            String filePath = parts[1];
            String storageUrl = supabaseUrl + "/storage/v1/object/" + PROFILE_BUCKET + "/" + filePath;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            restTemplate.exchange(storageUrl, HttpMethod.DELETE, requestEntity, String.class);

            // Using System.out here just for demo, ideally use Logger
            // System.out.println("✅ (Async) Deleted old profile image: " + filePath);
        } catch (Exception e) {
            System.err.println("⚠️ (Async) Failed to delete old profile image: " + e.getMessage());
        }
    }
}
