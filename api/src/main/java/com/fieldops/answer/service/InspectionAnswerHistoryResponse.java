package com.fieldops.answer.service;

import java.time.Instant;

/** Read-only response for one recorded answer in an inspection history. */
public record InspectionAnswerHistoryResponse(
        Long itemId,
        String section,
        String item,
        String value,
        String observation,
        Instant answeredAt,
        String answeredBy) {
}
