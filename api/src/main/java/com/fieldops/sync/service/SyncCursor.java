package com.fieldops.sync.service;

import com.fieldops.shared.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

/**
 * Opaque, monotonic cursor for the mobile incremental pull (PBI-053).
 *
 * <p>Why this encoding: the delta is ordered by {@code (updatedAt ASC, id ASC)} — a
 * stable total order even when several rows share the same {@code updatedAt} instant.
 * The cursor captures the last delivered position so the next pull returns only records
 * STRICTLY later in that order. We encode {@code "<epochSecond>|<nanoOfSecond>|<id>"} and
 * Base64 (URL-safe, no padding) it so the client treats the token as opaque and never
 * interprets or forges an ordering.
 *
 * <p>Seconds + nanos (not {@code epochMillis}) are used on purpose: {@link Instant} keeps
 * sub-millisecond precision, so truncating to millis would make the decoded cursor SMALLER
 * than the stored {@code updatedAt} and wrongly re-include the last delivered row under the
 * strict {@code >} comparison. Lossless round-trip keeps the delta exact. The {@code '|'}
 * separator can never appear inside the numeric parts.
 */
@Component
public class SyncCursor {

    private static final String CODE_INVALID_CURSOR = "INVALID_CURSOR";
    private static final String SEPARATOR = "|";

    public String encode(Instant updatedAt, long id) {
        String raw = updatedAt.getEpochSecond() + SEPARATOR + updatedAt.getNano() + SEPARATOR + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public Position decode(String cursor) {
        String raw = decodeBase64(cursor);
        String[] parts = raw.split("\\|", 3);
        if (parts.length != 3) {
            throw malformed(cursor);
        }
        return parsePosition(parts, cursor);
    }

    private String decodeBase64(String cursor) {
        try {
            return new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            throw malformed(cursor);
        }
    }

    private Position parsePosition(String[] parts, String cursor) {
        try {
            Instant updatedAt = Instant.ofEpochSecond(Long.parseLong(parts[0]), Long.parseLong(parts[1]));
            long id = Long.parseLong(parts[2]);
            return new Position(updatedAt, id);
        } catch (NumberFormatException | java.time.DateTimeException exception) {
            throw malformed(cursor);
        }
    }

    private BusinessException malformed(String cursor) {
        return new BusinessException(CODE_INVALID_CURSOR,
                "Invalid sync cursor '" + cursor + "'; expected an opaque token issued by a previous pull.");
    }

    /** Last delivered position in the (updatedAt, id) ordering. */
    public record Position(Instant updatedAt, long id) {
    }
}
