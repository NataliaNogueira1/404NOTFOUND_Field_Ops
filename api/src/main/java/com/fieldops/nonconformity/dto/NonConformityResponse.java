package com.fieldops.nonconformity.dto;

import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * API contract for a non-conformity returned by {@code GET /api/v1/non-conformities} (PBI-228).
 *
 * <p>Maps the {@code NonConformity} entity to a stable shape; the entity is never serialized
 * directly. Only real columns are exposed — there is no {@code updatedAt}.
 */
@Schema(description = "A non-conformity identified during an inspection")
public record NonConformityResponse(
        @Schema(description = "Non-conformity identifier") Long id,
        @Schema(description = "Identifier of the owning inspection") Long inspectionId,
        @Schema(description = "Denormalized client name of the owning inspection") String clientName,
        @Schema(description = "Optional checklist item snapshot this non-conformity refers to")
                Long inspectionItemSnapshotId,
        @Schema(description = "Short title") String title,
        @Schema(description = "Detailed description") String description,
        @Schema(description = "Risk level") NonConformitySeverity severity,
        @Schema(description = "Lifecycle status") NonConformityStatus status,
        @Schema(description = "When the non-conformity was reported") Instant createdAt,
        @Schema(description = "When the non-conformity was closed, if closed") Instant closedAt) {
}
