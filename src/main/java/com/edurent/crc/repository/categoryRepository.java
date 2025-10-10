package com.edurent.crc.repository;

import com.edurent.crc.entity.categoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface categoryRepository extends JpaRepository<categoryEntity, Long> {

}
