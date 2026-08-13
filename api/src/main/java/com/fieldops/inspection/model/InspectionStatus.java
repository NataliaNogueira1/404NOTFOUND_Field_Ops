package com.fieldops.inspection.model;

/**
 * Lifecycle of an inspection (stub contract — values follow the FieldOps flow:
 * scheduled → in progress → submitted → approved/rejected).
 */
public enum InspectionStatus {
    SCHEDULED,
    IN_PROGRESS,
    SUBMITTED,
    APPROVED,
    REJECTED
}
