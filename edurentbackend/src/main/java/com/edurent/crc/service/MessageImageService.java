package com.edurent.crc.service;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MessageImageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadImage(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        // Sanitize filename
        String safeFilename = "msg_" + UUID.randomUUID() + "_" + (originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "file");
        
        String storageUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + safeFilename;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("apikey", supabaseKey);
        headers.setContentType(MediaType.valueOf(file.getContentType()));

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

        // Send POST request to upload
        restTemplate.exchange(storageUrl, HttpMethod.POST, requestEntity, String.class);

        // Return the public URL
        return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + safeFilename;
    }
}