package com.puneet.backend.repository;

import com.puneet.backend.entity.Monitor;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonitorRepository extends CrudRepository<Monitor, UUID> {

    List<Monitor> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Monitor> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);
}