package com.fieldops.shared.exception;

import java.time.Instant;

/**
 * Standard error payload returned by every failed request.
 *
 * @param timestamp when the error occurred
 * @param status    HTTP status code
 * @param error     short HTTP reason phrase
 * @param message   human-readable detail
 * @param path      request path
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
