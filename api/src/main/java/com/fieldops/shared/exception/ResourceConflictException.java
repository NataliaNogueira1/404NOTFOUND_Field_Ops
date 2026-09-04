package com.fieldops.shared.exception;

/**
 * Thrown when a unique resource identifier is already in use. Maps to HTTP 409.
 */
public class ResourceConflictException extends RuntimeException {

    public ResourceConflictException(String message) {
        super(message);
    }
}
