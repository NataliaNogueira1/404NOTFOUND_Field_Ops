package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionTemplateStatus;

import java.time.Instant;

public record InspectionTemplateResponse(
        Long id,
        String title,
        String description,
        String category,
        InspectionTemplateStatus status,
        Integer currentVersion,
        Long createdBy,
        Instant createdAt,
        Instant updatedAt,
        Integer version) {
}
