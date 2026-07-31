package com.puneet.backend.exception;

import java.util.UUID;

/**
 * Thrown both when a monitor truly doesn't exist and when it exists but
 * belongs to a different user. Returning the same 404 in both cases avoids
 * leaking which monitor IDs exist to users who don't own them.
 */
public class MonitorNotFoundException extends RuntimeException {
    public MonitorNotFoundException(UUID id) {
        super("No monitor found with id: " + id);
    }
}