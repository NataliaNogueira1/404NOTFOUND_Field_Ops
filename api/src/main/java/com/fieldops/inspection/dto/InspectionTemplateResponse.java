package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionTemplateStatus;

import java.time.Instant;
import java.util.List;

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
        Integer version,
        List<TemplateSectionResponse> sections) {
}
