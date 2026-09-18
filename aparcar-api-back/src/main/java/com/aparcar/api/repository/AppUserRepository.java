package com.aparcar.api.repository;

import com.aparcar.api.entity.auth.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Repository interface for {@link AppUser} entities.
 */
@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Query("SELECT u.email FROM AppUser u WHERE u.isActive = false")
    Set<String> findInactiveEmails();
}
