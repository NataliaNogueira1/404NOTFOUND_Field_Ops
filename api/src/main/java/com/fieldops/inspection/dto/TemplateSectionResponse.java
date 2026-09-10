package com.fieldops.inspection.dto;

import java.time.Instant;
import java.util.List;

public record TemplateSectionResponse(
        Long id,
        String title,
        String description,
        Integer displayOrder,
        Instant createdAt,
        List<TemplateItemResponse> items) {
}
