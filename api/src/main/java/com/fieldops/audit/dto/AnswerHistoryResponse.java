package com.fieldops.audit.dto;

import java.time.Instant;

/**
 * One entry in an inspection's detailed answer history (PBI-088).
 *
 * <p>Matches the contract required by the issue — {@code itemId}, {@code section}, {@code value},
 * {@code observation}, {@code answeredAt}, {@code answeredBy} — plus a couple of read-only display
 * fields ({@code itemTitle}, {@code sectionOrder}, {@code itemOrder}) that let the admin group the
 * timeline by section and item without extra lookups. {@code value} is returned verbatim as stored,
 * with {@code responseType} so the consumer can interpret it (boolean, number, enum, text, ...).
 * {@code answeredBy} carries the author's display name (never sensitive account data); the numeric
 * id is exposed separately as {@code answeredById}.
 */
public record AnswerHistoryResponse(
        String itemId,
        String section,
        Integer sectionOrder,
        String itemTitle,
        Integer itemOrder,
        String responseType,
        String value,
        String observation,
        Instant answeredAt,
        String answeredBy,
        Long answeredById) {
}
