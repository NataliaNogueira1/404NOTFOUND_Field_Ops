package com.fieldops.shared.exception;

/**
 * Thrown when a request violates a business rule. Maps to HTTP 422.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
