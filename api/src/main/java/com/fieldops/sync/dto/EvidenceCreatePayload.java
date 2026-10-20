package com.fieldops.sync.dto;

import java.math.BigDecimal;
import java.time.Instant;

/** Metadata for an evidence binary already stored by the mobile client or object storage. */
public record EvidenceCreatePayload(
        Long inspectionId,
        Long itemId,
        String fileRef,
        String url,
        Instant capturedAt,
        BigDecimal latitude,
        BigDecimal longitude,
        String description) {

    public String reference() {
        return fileRef != null && !fileRef.isBlank() ? fileRef : url;
    }
}
