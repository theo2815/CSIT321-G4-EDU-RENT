package com.edurent.crc.controller;

import com.edurent.crc.entity.SchoolEntity; // Updated
import com.edurent.crc.service.SchoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/schools")
@CrossOrigin(origins = "*")
public class SchoolController {

    @Autowired
    private SchoolService schoolService;

    @GetMapping
    public List<SchoolEntity> getAllSchools() { // Updated
        return schoolService.getAllSchools();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SchoolEntity> getSchoolById(@PathVariable Long id) { // Updated
        return schoolService.getSchoolById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<SchoolEntity> getSchoolByDomain(@RequestParam String domain) { // Updated
        return schoolService.getSchoolByEmailDomain(domain)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SchoolEntity> createSchool(@RequestBody SchoolEntity school) { // Updated
        try {
            SchoolEntity newSchool = schoolService.createSchool(school); // Updated
            return new ResponseEntity<>(newSchool, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable Long id) {
        schoolService.deleteSchool(id);
        return ResponseEntity.noContent().build();
    }
}

