package com.edurent.crc.service;

import com.edurent.crc.entity.transactionEntity;
import com.edurent.crc.repository.transactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class transactionService {

    @Autowired
    private transactionRepository transactionRepository;

    public List<transactionEntity> findAllTransactions() {
        return transactionRepository.findAll();
    }
}
