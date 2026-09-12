package com.fieldops.inspection.dto;

import java.time.Instant;

public record InspectionTemplateVersionResponse(
        Long id,
        Integer versionNumber,
        String titleSnapshot,
        String descriptionSnapshot,
        Instant publishedAt,
        Long publishedBy) {
}
