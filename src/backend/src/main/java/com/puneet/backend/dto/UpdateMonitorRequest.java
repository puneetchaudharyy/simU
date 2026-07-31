package com.puneet.backend.dto;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.URL;

/**
 * PATCH semantics: every field is optional. Only non-null fields are applied
 * by the service layer; anything left null is left unchanged.
 */
public record UpdateMonitorRequest(
        @Size(max = 120) String name,
        @URL(protocol = "http") @Size(max = 2048) String url,
        @Pattern(regexp = "GET|POST|HEAD|PUT", message = "method must be one of GET, POST, HEAD, PUT")
        String method,
        @Min(100) @Max(599) Integer expectedStatusCode,
        @Min(10) @Max(86400) Integer checkIntervalSec,
        @Min(1000) @Max(60000) Integer timeoutMs,
        Boolean active
) {
}