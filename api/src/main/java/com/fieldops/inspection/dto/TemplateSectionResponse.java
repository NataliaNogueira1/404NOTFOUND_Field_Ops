package com.fieldops.inspection.dto;

import java.time.Instant;

public record TemplateSectionResponse(
        Long id,
        String title,
        String description,
        Integer displayOrder,
        Instant createdAt) {
}
