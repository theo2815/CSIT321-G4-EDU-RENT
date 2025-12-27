package com.edurent.crc.service;

import org.springframework.lang.NonNull;

import com.edurent.crc.entity.CategoryEntity;
import com.edurent.crc.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Get all categories - cached since categories rarely change.
     */
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryEntity> getAllCategories() {
        return categoryRepository.findAll();
    }

    /**
     * Get category by ID - cached individually.
     */
    @Cacheable(value = "categories", key = "'id_' + #id")
    public Optional<CategoryEntity> getCategoryById(@NonNull Long id) {
        return categoryRepository.findById(id);
    }

    /**
     * Get category by slug - cached individually.
     */
    @Cacheable(value = "categories", key = "'slug_' + #slug")
    public Optional<CategoryEntity> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    /**
     * Create a new category - evicts the entire categories cache.
     */
    @CacheEvict(value = "categories", allEntries = true)
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

    /**
     * Delete a category - evicts the entire categories cache.
     */
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(@NonNull Long id) {
        categoryRepository.deleteById(id);
    }
}
