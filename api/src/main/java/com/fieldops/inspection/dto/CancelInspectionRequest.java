package com.fieldops.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload to cancel an inspection. The reason is mandatory (min 10 chars) so the
 * cancellation is formally justified (PBI-029 / RN-029).
 */
public record CancelInspectionRequest(
        @NotBlank(message = "Cancellation reason is required")
        @Size(min = 10, max = 1000, message = "Cancellation reason must have between 10 and 1000 characters")
        String reason) {
}
