package com.fieldops.sync.dto;

/** Value and optional observation for a frozen inspection checklist item. */
public record AnswerUpsertPayload(
        Long inspectionId,
        Long itemId,
        String value,
        String observation) {
}
