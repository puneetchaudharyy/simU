package com.puneet.backend.dto;

import com.puneet.backend.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        boolean enabled,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.isEnabled(), user.getCreatedAt());
    }
}