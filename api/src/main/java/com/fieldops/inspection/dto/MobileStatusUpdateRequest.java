package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Status transition sent by the mobile client during sync (PBI-052).
 * {@code operationId} is the idempotency key so a resend does not apply the change twice.
 */
public record MobileStatusUpdateRequest(
        @NotNull(message = "operationId is required") UUID operationId,
        @NotNull(message = "status is required") InspectionStatus status) {
}
