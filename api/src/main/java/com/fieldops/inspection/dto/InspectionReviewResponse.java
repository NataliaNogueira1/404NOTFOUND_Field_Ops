package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Read model used by the Web checklist review. It intentionally exposes the latest answer only. */
public record InspectionReviewResponse(Long id, String title, InspectionStatus status, Priority priority,
        String clientName, String siteName, String equipmentName, String technicianName, LocalDate dueDate,
        Integer progress, Location startLocation, Location endLocation,
        Cancellation cancellation,
        List<Section> sections, List<NonConformity> nonConformities) {
    /** One-shot GPS reading shown in the review (PBI-045). Null when not captured (RN-059). */
    public record Location(Double latitude, Double longitude, Double accuracy, Instant capturedAt) {}
    /** Cancellation audit shown on the detail screen only when the inspection is CANCELED (#262). */
    public record Cancellation(String reason, String canceledBy, Instant canceledAt) {}
    public record Section(String title, Integer order, List<Item> items) {}
    public record Item(Long snapshotId, String code, String title, String description, String responseType,
            boolean required, String answer, String observation, Instant answeredAt, String answeredBy,
            List<Evidence> evidences, List<NonConformity> nonConformities) {}
    public record Evidence(Long id, String reference, String contentUrl, String description, String location,
            Instant capturedAt, String uploadedBy, Long itemSnapshotId) {}
    public record NonConformity(Long id, Long snapshotId, String title, String description, String severity,
            String status, Instant createdAt) {}
}
