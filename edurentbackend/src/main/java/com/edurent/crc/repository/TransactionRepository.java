package com.edurent.crc.repository;

import com.edurent.crc.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param; // Import this
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {

    @Query("SELECT t FROM TransactionEntity t WHERE t.listing.listingId = :listingId")
    Optional<TransactionEntity> findByListingId(@Param("listingId") Long listingId);

    @Query("SELECT t FROM TransactionEntity t WHERE t.buyer.userId = :buyerId")
    List<TransactionEntity> findByBuyerId(@Param("buyerId") Long buyerId);

    @Query("SELECT t FROM TransactionEntity t WHERE t.seller.userId = :sellerId")
    List<TransactionEntity> findBySellerId(@Param("sellerId") Long sellerId);
}
