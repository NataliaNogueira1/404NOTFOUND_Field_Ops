package com.fieldops.sync.dto;

/** A non-conformity reported by a technician against a frozen inspection item. */
public record NonConformityCreatePayload(
        Long inspectionId,
        Long itemId,
        String title,
        String description,
        String severity) {
}
