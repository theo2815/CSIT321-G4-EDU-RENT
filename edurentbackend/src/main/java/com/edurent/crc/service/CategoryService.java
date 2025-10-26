package com.edurent.crc.service;

import com.edurent.crc.entity.CategoryEntity; // Updated
import com.edurent.crc.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<CategoryEntity> getAllCategories() { // Updated
        return categoryRepository.findAll();
    }

    public Optional<CategoryEntity> getCategoryById(Long id) { // Updated
        return categoryRepository.findById(id);
    }

    public CategoryEntity createCategory(CategoryEntity category) { // Updated
        if (categoryRepository.findByName(category.getName()).isPresent()) {
            throw new IllegalStateException("Category '" + category.getName() + "' already exists.");
        }
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}

