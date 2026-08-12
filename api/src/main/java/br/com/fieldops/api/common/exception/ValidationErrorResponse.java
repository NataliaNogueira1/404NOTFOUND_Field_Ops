package br.com.fieldops.api.common.exception;

import java.time.Instant;
import java.util.List;

/**
 * Validation error payload — one {@link FieldIssue} per invalid field.
 *
 * @param timestamp when the error occurred
 * @param status    HTTP status code (always 400)
 * @param message   fixed label "Validation failed"
 * @param path      request path
 * @param issues    per-field validation details
 */
public record ValidationErrorResponse(
        Instant timestamp,
        int status,
        String message,
        String path,
        List<FieldIssue> issues
) {

    public record FieldIssue(String field, String message) {
    }
}
