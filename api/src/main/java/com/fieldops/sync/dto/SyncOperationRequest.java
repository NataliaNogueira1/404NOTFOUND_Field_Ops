package com.fieldops.sync.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * A single operation in a sync batch (PBI-051).
 * {@code dependencyIds} lists the operationIds this operation depends on; the server applies
 * dependencies first. {@code payload} is type-specific (e.g. {@code {inspectionId, status}}).
 */
public record SyncOperationRequest(
        @NotNull(message = "operationId is required") UUID operationId,
        @NotNull(message = "type is required") SyncOperationType type,
        List<UUID> dependencyIds,
        JsonNode payload) {

    public List<UUID> dependencyIds() {
        return dependencyIds == null ? List.of() : dependencyIds;
    }
}
