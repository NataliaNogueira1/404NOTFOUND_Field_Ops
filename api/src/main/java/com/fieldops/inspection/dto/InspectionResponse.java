package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;

/**
 * Inspection representation exposed to mobile. Part of the initial contract/stub.
 */
public record InspectionResponse(
        Long id,
        String title,
        InspectionStatus status,
        String scheduledDate,
        String clientName,
        String equipmentName,
        String technicianName
) {
}
