package com.fieldops.evidence.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Non-file multipart fields of an evidence upload. The binary itself is a separate
 * {@code file} part. The both-or-neither rule for latitude/longitude is enforced in the
 * service (cross-field), not here, so the standardized business error is returned.
 */
public record EvidenceUploadRequest(
        @Schema(description = "Source template item id the evidence binds to", example = "42")
        @NotNull(message = "itemId is required") Long itemId,

        @Schema(description = "Optional response id (accepted for forward-compat; not persisted yet)")
        Long responseId,

        @Schema(description = "MIME type used to derive the stored file extension", example = "image/jpeg")
        String mimeType,

        @Schema(description = "Optional free-text description of the evidence")
        String description,

        @Schema(description = "Latitude, required together with longitude", example = "-23.5505")
        BigDecimal latitude,

        @Schema(description = "Longitude, required together with latitude", example = "-46.6333")
        BigDecimal longitude,

        @Schema(description = "Device capture timestamp (ISO-8601)", example = "2026-10-05T12:00:00Z")
        @NotNull(message = "capturedAtDevice is required") Instant capturedAtDevice,

        @Schema(description = "Client-generated idempotency key for this upload")
        @NotNull(message = "operationId is required") UUID operationId) {
}
