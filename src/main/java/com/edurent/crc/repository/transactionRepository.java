package com.edurent.crc.repository;

import com.edurent.crc.entity.transactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface transactionRepository extends JpaRepository<transactionEntity, Long> {

}
