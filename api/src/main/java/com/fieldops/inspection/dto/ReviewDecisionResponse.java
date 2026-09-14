package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;

import java.time.Instant;

/**
 * Result of an approve/reject decision, exposing the audit trail written by the operation.
 * {@code comment} carries the approval comment; {@code rejectionReason} the rejection reason.
 */
public record ReviewDecisionResponse(
        Long id,
        InspectionStatus status,
        Instant reviewedAt,
        Long reviewedBy,
        String comment,
        String rejectionReason) {
}
