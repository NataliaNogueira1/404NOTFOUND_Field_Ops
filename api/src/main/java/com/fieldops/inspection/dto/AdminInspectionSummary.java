package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;

import java.time.LocalDate;

public record AdminInspectionSummary(
        Long id,
        String title,
        String clientName,
        String siteName,
        String equipmentName,
        Long technicianId,
        String technicianName,
        Priority priority,
        LocalDate dueDate,
        InspectionStatus status,
        Integer progress,
        boolean overdue) {
}
