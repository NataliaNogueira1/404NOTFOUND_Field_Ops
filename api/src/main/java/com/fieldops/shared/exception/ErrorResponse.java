package com.fieldops.shared.exception;

import java.time.Instant;
import java.util.List;

/**
 * Standard error payload returned by every failed request.
 * {@code fieldErrors} is populated on validation failures and empty otherwise.
 *
 * @param timestamp   when the error occurred
 * @param status      HTTP status code
 * @param code        stable machine-readable error code (e.g. {@code VALIDATION_ERROR})
 * @param message     human-readable detail
 * @param path        request path
 * @param fieldErrors per-field validation details (empty for non-validation errors)
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<FieldError> fieldErrors
) {

    public record FieldError(String field, String message) {
    }
}
