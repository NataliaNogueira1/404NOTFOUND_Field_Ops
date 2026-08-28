package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.*;

import java.util.List;

/**
 * Full inspection response for mobile pull — includes the template snapshot (sections + items).
 * Matches the contract expected by InspectionSyncService on the mobile side.
 */
public record MobileInspectionResponse(
        String id,
        String title,
        String templateId,
        String clientId,
        String clientName,
        String siteId,
        String siteName,
        String equipmentId,
        String equipmentName,
        String technicianId,
        String supervisorId,
        String supervisorName,
        String status,
        String priority,
        String dueDate,
        String dueTime,
        String createdAt,
        String startedAt,
        Integer progress,
        String supervisorInstructions,
        TemplateDto template
) {

    public record TemplateDto(
            String id,
            String title,
            String category,
            Integer version,
            List<SectionDto> sections
    ) {}

    public record SectionDto(
            String id,
            String title,
            List<ItemDto> items
    ) {}

    public record ItemDto(
            String id,
            String question,
            String description,
            String responseType,
            boolean required,
            boolean requireObservationOnFailure,
            boolean requireEvidenceOnFailure,
            List<String> options
    ) {}
}
