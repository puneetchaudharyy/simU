package com.puneet.backend.repository;

import com.puneet.backend.entity.RefreshToken;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends CrudRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteAllByUserId(UUID userId);
}