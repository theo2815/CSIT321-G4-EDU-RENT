package com.edurent.crc.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; 
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edurent.crc.entity.TransactionEntity;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {

    // Methods to find transactions by listing ID, buyer ID, and seller ID
    @Query(value = "SELECT * FROM transactions WHERE listing_id = :listingId ORDER BY transaction_id DESC LIMIT 1", nativeQuery = true)
    Optional<TransactionEntity> findLatestByListingId(@Param("listingId") Long listingId);

    // Methods to find transactions by buyer ID
    @Query("SELECT t FROM TransactionEntity t WHERE t.buyer.userId = :buyerId")
    List<TransactionEntity> findByBuyerId(@Param("buyerId") Long buyerId);

    // Methods to find transactions by seller ID
    @Query("SELECT t FROM TransactionEntity t WHERE t.seller.userId = :sellerId")
    List<TransactionEntity> findBySellerId(@Param("sellerId") Long sellerId);

    // New method to find expired rentals
    @Query("SELECT t FROM TransactionEntity t " +
           "JOIN t.listing l " +
           "WHERE t.transactionType = 'Rent' " +
           "AND l.status = 'Rented' " +
           "AND t.endDate < CURRENT_TIMESTAMP")
    List<TransactionEntity> findExpiredRentals();

    @Query("SELECT t FROM TransactionEntity t WHERE t.transactionType = 'Rent' AND t.status = 'Active' AND t.endDate < :now")
    List<TransactionEntity> findExpiredRentals(@Param("now") Date now);
}
