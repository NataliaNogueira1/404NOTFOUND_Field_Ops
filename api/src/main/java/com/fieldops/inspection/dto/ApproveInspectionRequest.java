package com.fieldops.inspection.dto;

import jakarta.validation.constraints.Size;

/**
 * Payload to approve an inspection (PBI-060). The comment is optional.
 */
public record ApproveInspectionRequest(
        @Size(max = 2000, message = "Comment must have at most 2000 characters")
        String comment) {
}
