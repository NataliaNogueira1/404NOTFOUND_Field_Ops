package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Read model used by the Web checklist review. It intentionally exposes the latest answer only. */
public record InspectionReviewResponse(Long id, String title, InspectionStatus status, Priority priority,
        String clientName, String siteName, String equipmentName, String technicianName, LocalDate dueDate,
        Integer progress, List<Section> sections, List<NonConformity> nonConformities) {
    public record Section(String title, Integer order, List<Item> items) {}
    public record Item(Long snapshotId, String code, String title, String description, String responseType,
            boolean required, String answer, String observation, Instant answeredAt, String answeredBy,
            List<Evidence> evidences, List<NonConformity> nonConformities) {}
    public record Evidence(Long id, String reference, String contentUrl, String description, String location,
            Instant capturedAt, String uploadedBy, Long itemSnapshotId) {}
    public record NonConformity(Long id, Long snapshotId, String title, String description, String severity,
            String status, Instant createdAt) {}
}
