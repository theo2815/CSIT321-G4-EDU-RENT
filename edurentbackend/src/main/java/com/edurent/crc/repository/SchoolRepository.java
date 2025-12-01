package com.edurent.crc.repository;

import com.edurent.crc.entity.SchoolEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<SchoolEntity, Long> { 
    Optional<SchoolEntity> findByEmailDomain(String emailDomain);
}

