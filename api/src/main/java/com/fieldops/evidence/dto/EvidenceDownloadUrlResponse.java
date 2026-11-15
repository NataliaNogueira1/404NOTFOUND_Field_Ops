package com.fieldops.evidence.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/** Where the Web Admin can fetch an evidence image: a temporary storage link or the API content endpoint. */
public record EvidenceDownloadUrlResponse(
        @Schema(description = "Absolute presigned URL when presigned is true; otherwise the API path that needs the Bearer token",
                example = "https://fieldops-evidencias.s3.us-east-1.amazonaws.com/9f2c.png?X-Amz-Expires=300")
        String url,

        @Schema(description = "When the presigned URL stops working (ISO-8601); null when not presigned",
                example = "2026-11-15T10:05:00Z")
        Instant expiresAt,

        @Schema(description = "True when the URL is a self-contained link that must be fetched without the Authorization header")
        boolean presigned) {
}
