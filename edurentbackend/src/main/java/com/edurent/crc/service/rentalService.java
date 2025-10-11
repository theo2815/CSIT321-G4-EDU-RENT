package com.edurent.crc.service;

import com.edurent.crc.entity.rentalEntity;
import com.edurent.crc.repository.rentalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class rentalService {

    @Autowired
    private rentalRepository rentalRepository;

    public List<rentalEntity> findAllRentals() {
        return rentalRepository.findAll();
    }
}
