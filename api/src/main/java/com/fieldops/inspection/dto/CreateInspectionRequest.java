package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.Priority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateInspectionRequest(
        @NotBlank @Size(max = 300) String title,
        @NotNull Long templateVersionId,
        @NotNull Long clientId,
        @NotNull Long siteId,
        Long equipmentId,
        @NotNull Long technicianId,
        @NotNull Priority priority,
        @NotNull @FutureOrPresent LocalDate dueDate,
        LocalTime dueTime,
        @Size(max = 2000, message = "Instructions must have at most 2000 characters")
        String supervisorInstructions
) {
}
