package com.fieldops.sync.dto;

/**
 * Types of sync operations the mobile client can push in a batch (PBI-051).
 * Evidence metadata is persisted independently of its binary, which is uploaded to object
 * storage separately and referenced by {@link #EVIDENCE_CREATE}.
 */
public enum SyncOperationType {
    INSPECTION_STATUS,
    ANSWER_UPSERT,
    EVIDENCE_CREATE,
    NON_CONFORMITY_CREATE
}
