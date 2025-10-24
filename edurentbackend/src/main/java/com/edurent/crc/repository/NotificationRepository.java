package com.edurent.crc.repository;

import com.edurent.crc.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Import this
import org.springframework.data.repository.query.Param; // Import this
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    @Query("SELECT n FROM NotificationEntity n WHERE n.user.userId = :userId")
    List<NotificationEntity> findByUserId(@Param("userId") Long userId);

    @Query("SELECT n FROM NotificationEntity n WHERE n.user.userId = :userId AND n.isRead = :isRead")
    List<NotificationEntity> findByUserIdAndIsRead(@Param("userId") Long userId, @Param("isRead") Boolean isRead);
}
