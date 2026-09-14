package com.fieldops.audit.model;

/**
 * Auditable actions tracked across entity lifecycles (PBI-063).
 * Inspection state changes are the primary use, but the trail is generic.
 */
public enum AuditAction {
    INSPECTION_CREATED,
    INSPECTION_ASSIGNED,
    INSPECTION_STARTED,
    INSPECTION_SUBMITTED,
    INSPECTION_REVIEW_STARTED,
    INSPECTION_APPROVED,
    INSPECTION_REJECTED,
    INSPECTION_CANCELED
}
