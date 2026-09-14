package com.fieldops.shared.exception;

/**
 * Thrown when a request violates a business rule. Maps to HTTP 422.
 * The default machine-readable code is {@code BUSINESS_RULE}; callers may supply a
 * more specific code (e.g. {@code TECHNICIAN_NOT_ACTIVE}) for clients to branch on.
 */
public class BusinessException extends RuntimeException {

    private static final String DEFAULT_CODE = "BUSINESS_RULE";

    private final String code;

    public BusinessException(String message) {
        this(DEFAULT_CODE, message);
    }

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
