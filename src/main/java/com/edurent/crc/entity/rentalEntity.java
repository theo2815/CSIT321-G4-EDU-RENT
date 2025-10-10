package com.edurent.crc.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.time.LocalDate; // Using LocalDate for dates without time

// This maps to the 'rental' table
@Entity(name = "rental")
public class rentalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rentalId; // rental_id

    private Long productId; // FK to ProductEntity
    private Long renterId; // FK to UserEntity

    private LocalDate renterStartDate;
    private LocalDate renterEndDate;
    private Double rentalPrice; // e.g., per day or per week

    // Getters and Setters
    public Long getRentalId() { return rentalId; }
    public void setRentalId(Long rentalId) { this.rentalId = rentalId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getRenterId() { return renterId; }
    public void setRenterId(Long renterId) { this.renterId = renterId; }
    public LocalDate getRenterStartDate() { return renterStartDate; }
    public void setRenterStartDate(LocalDate renterStartDate) { this.renterStartDate = renterStartDate; }
    public LocalDate getRenterEndDate() { return renterEndDate; }
    public void setRenterEndDate(LocalDate renterEndDate) { this.renterEndDate = renterEndDate; }
    public Double getRentalPrice() { return rentalPrice; }
    public void setRentalPrice(Double rentalPrice) { this.rentalPrice = rentalPrice; }

    public rentalEntity() {}
}