package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;

import java.time.Instant;

/**
 * Result of cancelling an inspection, exposing the audit trail written by the operation.
 */
public record CancelInspectionResponse(
        Long id,
        InspectionStatus status,
        Instant canceledAt,
        Long canceledBy,
        String canceledReason) {
}
