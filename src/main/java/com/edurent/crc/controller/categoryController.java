package com.edurent.crc.controller;

import com.edurent.crc.entity.categoryEntity;
import com.edurent.crc.service.categoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:3000")
public class categoryController {

    @Autowired
    private categoryService categoryService;

    @GetMapping 
    public List<categoryEntity> getAllCategories() {
        return categoryService.findAllCategories();
    }
}
