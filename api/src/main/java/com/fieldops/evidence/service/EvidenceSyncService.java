package com.fieldops.evidence.service;

import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.sync.dto.EvidenceCreatePayload;
import com.fieldops.sync.service.IdempotencyService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Persists evidence metadata received through the offline synchronization batch. */
@Service
public class EvidenceSyncService {

    private static final String OPERATION_TYPE = "EVIDENCE_CREATE";

    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final InspectionEvidenceRepository evidenceRepository;
    private final IdempotencyService idempotencyService;

    public EvidenceSyncService(InspectionRepository inspectionRepository,
            InspectionItemSnapshotRepository snapshotRepository,
            InspectionEvidenceRepository evidenceRepository, IdempotencyService idempotencyService) {
        this.inspectionRepository = inspectionRepository;
        this.snapshotRepository = snapshotRepository;
        this.evidenceRepository = evidenceRepository;
        this.idempotencyService = idempotencyService;
    }

    /**
     * Creates evidence metadata and records its operation atomically.
     * The binary is deliberately not transferred here: {@code fileRef} or {@code url} identifies
     * an object uploaded through the storage pipeline.
     */
    @Transactional
    public Long create(EvidenceCreatePayload payload, UUID operationId, Long technicianId) {
        validate(payload);
        Inspection inspection = inspectionRepository.findById(payload.inspectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + payload.inspectionId()));
        assertTechnicianOwns(inspection, technicianId);
        InspectionItemSnapshot item = snapshotRepository
                .findByInspectionIdAndSourceTemplateItemId(inspection.getId(), payload.itemId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection item not found for inspection: " + payload.itemId()));

        InspectionEvidence evidence = InspectionEvidence.create(inspection, item, payload.reference(),
                checksum(payload.reference()), payload.description(), location(payload), payload.capturedAt(),
                inspection.getTechnician());
        InspectionEvidence saved = evidenceRepository.save(evidence);
        idempotencyService.markProcessed(operationId, OPERATION_TYPE, saved.getId(), saved.getReference());
        return saved.getId();
    }

    private void validate(EvidenceCreatePayload payload) {
        if (payload == null || payload.inspectionId() == null || payload.itemId() == null
                || payload.capturedAt() == null || payload.reference() == null || payload.reference().isBlank()) {
            throw new BusinessException("EVIDENCE_CREATE requires inspectionId, itemId, fileRef or url, and capturedAt");
        }
        if ((payload.latitude() == null) != (payload.longitude() == null)) {
            throw new BusinessException("EVIDENCE_CREATE requires both latitude and longitude when location is provided");
        }
        if (payload.latitude() != null && (payload.latitude().abs().compareTo(new java.math.BigDecimal("90")) > 0
                || payload.longitude().abs().compareTo(new java.math.BigDecimal("180")) > 0)) {
            throw new BusinessException("EVIDENCE_CREATE location is outside valid latitude/longitude bounds");
        }
    }

    private void assertTechnicianOwns(Inspection inspection, Long technicianId) {
        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new BusinessException("Inspection is not assigned to this technician: " + inspection.getId());
        }
    }

    private String location(EvidenceCreatePayload payload) {
        if (payload.latitude() == null) {
            return null;
        }
        return "{\"latitude\":" + payload.latitude().toPlainString()
                + ",\"longitude\":" + payload.longitude().toPlainString() + "}";
    }

    private String checksum(String reference) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(reference.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
