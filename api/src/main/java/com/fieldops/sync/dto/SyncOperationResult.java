package com.fieldops.sync.dto;

import java.util.UUID;

/**
 * Per-operation outcome of a sync batch (PBI-051).
 * <ul>
 *   <li>APPLIED — the operation was applied now.</li>
 *   <li>ALREADY_APPLIED — idempotent resend; already processed in a previous batch.</li>
 *   <li>DEFERRED — a dependency was not resolved in this batch; retry next cycle.</li>
 *   <li>FAILED — the operation was rejected (validation/business rule); detail explains why.</li>
 * </ul>
 */
public record SyncOperationResult(UUID operationId, Status status, String detail) {

    public enum Status {
        APPLIED,
        ALREADY_APPLIED,
        DEFERRED,
        FAILED
    }

    public static SyncOperationResult applied(UUID id) {
        return new SyncOperationResult(id, Status.APPLIED, null);
    }

    public static SyncOperationResult alreadyApplied(UUID id) {
        return new SyncOperationResult(id, Status.ALREADY_APPLIED, null);
    }

    public static SyncOperationResult deferred(UUID id, String detail) {
        return new SyncOperationResult(id, Status.DEFERRED, detail);
    }

    public static SyncOperationResult failed(UUID id, String detail) {
        return new SyncOperationResult(id, Status.FAILED, detail);
    }
}
