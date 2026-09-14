package com.fieldops.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload to reject an inspection (PBI-061). The reason is mandatory (min 10 chars).
 */
public record RejectInspectionRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(min = 10, max = 2000, message = "Rejection reason must have between 10 and 2000 characters")
        String reason) {
}
