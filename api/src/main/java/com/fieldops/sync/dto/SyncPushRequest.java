package com.fieldops.sync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Batch of operations pushed by the mobile client in one request (PBI-051).
 */
public record SyncPushRequest(
        @NotEmpty(message = "operations must not be empty") @Valid List<SyncOperationRequest> operations) {
}
