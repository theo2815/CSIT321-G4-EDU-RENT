package com.edurent.crc.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null)
            originalFilename = "file";

        // Remove extension for public_id as Cloudinary adds it automatically
        String publicId = UUID.randomUUID().toString() + "_"
                + originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_").replaceFirst("[.][^.]+$", "");

        @SuppressWarnings("unchecked")
        Map<String, Object> params = ObjectUtils.asMap(
                "folder", folder,
                "public_id", publicId,
                "resource_type", "auto" // Auto detect image/video
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        return (String) uploadResult.get("secure_url");
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty())
            return;

        try {
            // Extract public_id from URL
            // Example:
            // https://res.cloudinary.com/demo/image/upload/v1570979139/folder/sample.jpg

            // 1. Remove version and host parts. We typically need "folder/filename"
            // (without extension)
            // This parsing logic depends on provided URL structure.
            // A safer way is to store public_id in DB, but for migration we parse URL.

            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                System.out.println("Deleted Cloudinary image: " + publicId);
            }
        } catch (IOException e) {
            System.err.println("Failed to delete Cloudinary image: " + e.getMessage());
        }
    }

    private String extractPublicIdFromUrl(String url) {
        try {
            // Basic extraction logic:
            // 1. Find the part after "/upload/"
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1)
                return null;

            String path = url.substring(uploadIndex + 8); // Skip "/upload/"

            // 2. Skip version "v123456789/" if present
            if (path.startsWith("v") && path.indexOf("/") > 0) {
                // Check if valid version format (v + digits)
                int slashIdx = path.indexOf("/");
                String potentialVersion = path.substring(0, slashIdx);
                if (potentialVersion.matches("v\\d+")) {
                    path = path.substring(slashIdx + 1);
                }
            }

            // 3. Remove extension
            int lastDot = path.lastIndexOf(".");
            if (lastDot > 0) {
                path = path.substring(0, lastDot);
            }

            return path;
        } catch (Exception e) {
            return null;
        }
    }
}
