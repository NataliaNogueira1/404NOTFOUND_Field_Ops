package com.fieldops.sync.dto;

/**
 * Types of sync operations the mobile client can push in a batch (PBI-051).
 * Only INSPECTION_STATUS is implemented server-side today; answer/evidence/non-conformity
 * types will be added when their endpoints exist and can reuse this batch framework.
 */
public enum SyncOperationType {
    INSPECTION_STATUS
}
