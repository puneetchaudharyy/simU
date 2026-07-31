package com.puneet.backend.dto;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.URL;

public record CreateMonitorRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @URL(protocol = "http") @Size(max = 2048) String url,
        @Pattern(regexp = "GET|POST|HEAD|PUT", message = "method must be one of GET, POST, HEAD, PUT")
        String method,
        @Min(100) @Max(599) Integer expectedStatusCode,
        @Min(10) @Max(86400) Integer checkIntervalSec,
        @Min(1000) @Max(60000) Integer timeoutMs
) {
    public String methodOrDefault() {
        return method == null || method.isBlank() ? "GET" : method;
    }

    public int expectedStatusCodeOrDefault() {
        return expectedStatusCode == null ? 200 : expectedStatusCode;
    }

    public int checkIntervalSecOrDefault() {
        return checkIntervalSec == null ? 60 : checkIntervalSec;
    }

    public int timeoutMsOrDefault() {
        return timeoutMs == null ? 5000 : timeoutMs;
    }
}