package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleInspectionResponse(
        Long id,
        String title,
        Long templateId,
        String templateTitle,
        String clientName,
        String siteName,
        String equipmentName,
        Long technicianId,
        String technicianName,
        Long supervisorId,
        String supervisorName,
        Priority priority,
        LocalDate dueDate,
        LocalTime dueTime,
        String supervisorInstructions,
        InspectionStatus status,
        Integer progress,
        Instant createdAt) {
}
