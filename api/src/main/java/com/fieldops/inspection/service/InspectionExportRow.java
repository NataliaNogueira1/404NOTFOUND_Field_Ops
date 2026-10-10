package com.fieldops.inspection.service;

import java.time.Instant;
import java.time.LocalDate;

/** Flat export projection that keeps CSV formatting independent from JPA entities. */
public record InspectionExportRow(
        Long id,
        String title,
        String client,
        String site,
        String equipment,
        String technician,
        String status,
        String priority,
        LocalDate dueDate,
        Instant createdAt,
        Instant completedAt,
        Long nonConformities) {
}
