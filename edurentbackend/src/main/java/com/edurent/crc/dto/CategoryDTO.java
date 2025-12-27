package com.edurent.crc.dto;

public class CategoryDTO {
    private Long categoryId;
    private String categoryName;
    private String description;

    // Constructors
    public CategoryDTO() {
    }

    public CategoryDTO(Long categoryId, String categoryName) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
    }

    // Getters and Setters
    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    // Alias for frontend compatibility (frontend uses category.name)
    public String getName() {
        return categoryName;
    }
}
