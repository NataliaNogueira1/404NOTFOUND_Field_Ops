package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.Priority;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleInspectionRequest(

        @NotNull(message = "Template is required")
        Long templateId,

        @NotNull(message = "Technician is required")
        Long technicianId,

        @NotBlank(message = "Client name is required")
        @Size(max = 200, message = "Client name must have at most 200 characters")
        String clientName,

        @NotBlank(message = "Site name is required")
        @Size(max = 200, message = "Site name must have at most 200 characters")
        String siteName,

        @NotBlank(message = "Equipment name is required")
        @Size(max = 200, message = "Equipment name must have at most 200 characters")
        String equipmentName,

        @NotNull(message = "Priority is required")
        Priority priority,

        @NotNull(message = "Due date is required")
        @Future(message = "Due date must be in the future")
        LocalDate dueDate,

        LocalTime dueTime,

        String supervisorInstructions) {
}
