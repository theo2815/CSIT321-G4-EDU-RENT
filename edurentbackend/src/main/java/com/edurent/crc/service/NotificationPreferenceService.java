package com.edurent.crc.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationPreferenceService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anonKey}")
    private String supabaseAnonKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Boolean> getPreferencesForUser(long userId) {
        try {
            // Supabase REST endpoint for the table
            String url = supabaseUrl + "/rest/v1/notification_preferences?user_id=eq." + userId + "&select=*";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("apikey", supabaseAnonKey)
                    .header("Authorization", "Bearer " + supabaseAnonKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                JsonNode arr = objectMapper.readTree(resp.body());
                if (arr.isArray() && arr.size() > 0) {
                    JsonNode row = arr.get(0);
                    boolean all = row.path("all_notifications").asBoolean(true);
                    boolean likes = row.path("likes").asBoolean(true);
                    boolean messages = row.path("messages").asBoolean(true);
                    boolean email = row.path("email").asBoolean(false);
                    return Map.of(
                        "all_notifications", all,
                        "likes", likes,
                        "messages", messages,
                        "email", email
                    );
                }
            }
        } catch (Exception e) {
            // Log and fallback to defaults
            System.err.println("Failed to fetch Supabase notification preferences: " + e.getMessage());
        }
        // Defaults when no row or failure
        return Map.of(
            "all_notifications", true,
            "likes", true,
            "messages", true,
            "email", false
        );
    }
}
