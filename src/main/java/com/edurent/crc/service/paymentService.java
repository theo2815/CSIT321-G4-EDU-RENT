package com.edurent.crc.service;

import com.edurent.crc.entity.paymentEntity;
import com.edurent.crc.repository.paymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class paymentService {

    @Autowired
    private paymentRepository paymentRepository;

    public List<paymentEntity> findAllPayments() {
        return paymentRepository.findAll();
    }
}