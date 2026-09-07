package com.fieldops.inspection.dto;

public record InspectionTemplateSummary(
        Long id,
        String title,
        String category,
        Integer version,
        long sectionCount,
        long itemCount,
        String status) {
}
