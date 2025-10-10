package com.edurent.crc.service;

import com.edurent.crc.entity.categoryEntity;
import com.edurent.crc.repository.categoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class categoryService {

    @Autowired
    private categoryRepository categoryRepository;

    public List<categoryEntity> findAllCategories() {
        return categoryRepository.findAll();
    }
}
