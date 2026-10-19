package com.fieldops.sync.dto;

/**
 * Classifies a pulled inspection change for the mobile client (PBI-053).
 * Derived from the inspection's CURRENT status: REVIEW for APPROVED/REJECTED,
 * CANCELLATION for CANCELED, INSPECTION otherwise.
 */
public enum SyncChangeType {
    INSPECTION,
    REVIEW,
    CANCELLATION
}
