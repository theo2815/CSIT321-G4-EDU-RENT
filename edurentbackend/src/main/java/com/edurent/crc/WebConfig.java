package com.edurent.crc;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Define the directory where images are stored relative to the application root
    private final String uploadDir = "uploads/listing-images/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the absolute path to the upload directory
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        String uploadPathString = uploadPath.toString();

        System.out.println("Serving static files from directory: " + uploadPathString); // Log the path

        // Map the URL path /uploads/listing-images/** to the file system directory
        // Use "file:" prefix to indicate it's a file system path
        registry.addResourceHandler("/uploads/listing-images/**")
                .addResourceLocations("file:" + uploadPathString + "/");

        // Optional: Add handler for other static resources if needed
        // registry.addResourceHandler("/**").addResourceLocations("classpath:/static/");
    }
}
