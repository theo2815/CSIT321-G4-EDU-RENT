package com.edurent.crc.service;

import com.edurent.crc.entity.SchoolEntity; // Updated
import com.edurent.crc.repository.SchoolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SchoolService {

    @Autowired
    private SchoolRepository schoolRepository;

    public List<SchoolEntity> getAllSchools() { // Updated
        return schoolRepository.findAll();
    }

    public Optional<SchoolEntity> getSchoolById(Long id) { // Updated
        return schoolRepository.findById(id);
    }

    public Optional<SchoolEntity> getSchoolByEmailDomain(String domain) { // Updated
        return schoolRepository.findByEmailDomain(domain);
    }

    public SchoolEntity createSchool(SchoolEntity school) { // Updated
        if (schoolRepository.findByEmailDomain(school.getEmailDomain()).isPresent()) {
            throw new IllegalStateException("School with domain " + school.getEmailDomain() + " already exists.");
        }
        return schoolRepository.save(school);
    }

    public void deleteSchool(Long id) {
        schoolRepository.deleteById(id);
    }
}

