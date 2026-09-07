package com.aparcar.api.repository;

import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.auth.OneTimePassword;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository interface for {@link OneTimePassword} entities.
 */
public interface OneTimePasswordRepository extends JpaRepository<OneTimePassword, Long> {
    Optional<OneTimePassword> findByUser(AppUser user);

    Optional<OneTimePassword> findByUserAndToken(AppUser email, String token);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM OneTimePassword o WHERE o.expiresAt < :before")
    int deleteExpired(@Param("before") Instant before);
}
