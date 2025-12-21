package com.edurent.crc.service;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MessageImageService {

    @Autowired
    private CloudinaryService cloudinaryService;

    public String uploadImage(MultipartFile file) throws IOException {
        return cloudinaryService.uploadImage(file, "chat");
    }
}