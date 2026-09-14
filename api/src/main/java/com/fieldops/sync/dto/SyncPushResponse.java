package com.fieldops.sync.dto;

import java.util.List;

/**
 * Result of a sync batch: one {@link SyncOperationResult} per submitted operation (PBI-051).
 */
public record SyncPushResponse(List<SyncOperationResult> results) {
}
