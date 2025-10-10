package com.edurent.crc.repository;

import com.edurent.crc.entity.paymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface paymentRepository extends JpaRepository<paymentEntity, Long> {

}
