package com.edurent.crc.service;

import org.springframework.lang.NonNull;

import com.edurent.crc.entity.CategoryEntity;
import com.edurent.crc.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<CategoryEntity> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<CategoryEntity> getCategoryById(@NonNull Long id) {
        return categoryRepository.findById(id);
    }

    public Optional<CategoryEntity> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    public CategoryEntity createCategory(CategoryEntity category) {
        if (categoryRepository.findByName(category.getName()).isPresent()) {
            throw new IllegalStateException("Category '" + category.getName() + "' already exists.");
        }

        // Generate slug from name
        if (category.getSlug() == null || category.getSlug().isEmpty()) {
            String slug = category.getName().toLowerCase().replaceAll("[^a-z0-9]", "-");
            category.setSlug(slug);
        }

        return categoryRepository.save(category);
    }

    public void deleteCategory(@NonNull Long id) {
        categoryRepository.deleteById(id);
    }
}
