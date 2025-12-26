package com.edurent.crc;

import org.springframework.lang.NonNull;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Directory where listing images are uploaded
    private final String uploadDir = "uploads/listing-images/";

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        String uploadPathString = uploadPath.toString();

        System.out.println("Serving static files from directory: " + uploadPathString);

        registry.addResourceHandler("/uploads/listing-images/**")
                .addResourceLocations("file:" + uploadPathString + "/");

    }
}
