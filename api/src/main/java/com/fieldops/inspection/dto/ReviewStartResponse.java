package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;

/** Result of formally moving a submitted inspection into the review workflow. */
public record ReviewStartResponse(Long id, InspectionStatus status) {
}
