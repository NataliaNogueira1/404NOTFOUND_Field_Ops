package com.fieldops.inspection.model;

/**
 * Lifecycle states of an inspection, matching the FieldOps domain model:
 * DRAFT → ASSIGNED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / CANCELED
 */
public enum InspectionStatus {
    DRAFT,
    ASSIGNED,
    IN_PROGRESS,
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    CANCELED
}
