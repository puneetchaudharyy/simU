package com.puneet.backend.dto;

import com.puneet.backend.entity.Monitor;

import java.time.LocalDateTime;
import java.util.UUID;

public record MonitorResponse(
        UUID id,
        String name,
        String url,
        String method,
        int expectedStatusCode,
        int checkIntervalSec,
        int timeoutMs,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static MonitorResponse from(Monitor m) {
        return new MonitorResponse(
                m.getId(), m.getName(), m.getUrl(), m.getMethod(),
                m.getExpectedStatusCode(), m.getCheckIntervalSec(), m.getTimeoutMs(),
                m.isActive(), m.getCreatedAt(), m.getUpdatedAt()
        );
    }
}