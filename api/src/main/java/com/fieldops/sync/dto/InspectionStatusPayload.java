package com.fieldops.sync.dto;

import com.fieldops.inspection.dto.CapturedLocation;

/**
 * Payload of an {@code INSPECTION_STATUS} sync operation: the target status plus the
 * optional one-shot GPS location captured at that moment (PBI-045).
 *
 * <p>{@code location} is null when the technician skipped or was denied the location
 * permission (RN-059); the transition still applies without it.</p>
 */
public record InspectionStatusPayload(
        Long inspectionId,
        String status,
        CapturedLocation location) {
}
