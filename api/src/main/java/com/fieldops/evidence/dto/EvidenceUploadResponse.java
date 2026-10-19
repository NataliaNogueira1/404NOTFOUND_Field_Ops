package com.fieldops.evidence.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Result of an evidence upload: the persisted evidence id and its content checksum. */
public record EvidenceUploadResponse(
        @Schema(description = "Persisted evidence id", example = "1001") Long id,
        @Schema(description = "SHA-256 of the stored file content", example = "9f86d081...") String checksum) {
}
