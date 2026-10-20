package com.fieldops.evidence.service;

import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
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
    private final InspectionEvidenceRepository evidenceRepository;
    private final IdempotencyService idempotencyService;
    private final EvidenceMetadataFactory metadataFactory;

    public EvidenceSyncService(InspectionRepository inspectionRepository,
            InspectionEvidenceRepository evidenceRepository, IdempotencyService idempotencyService,
            EvidenceMetadataFactory metadataFactory) {
        this.inspectionRepository = inspectionRepository;
        this.evidenceRepository = evidenceRepository;
        this.idempotencyService = idempotencyService;
        this.metadataFactory = metadataFactory;
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
        metadataFactory.assertTechnicianOwns(inspection, technicianId);
        InspectionItemSnapshot item = metadataFactory.resolveItem(inspection, payload.itemId());

        InspectionEvidence evidence = InspectionEvidence.create(inspection, item, payload.reference(),
                checksum(payload.reference()), payload.description(),
                metadataFactory.locationJson(payload.latitude(), payload.longitude()), payload.capturedAt(),
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
        metadataFactory.validateLocation(payload.latitude(), payload.longitude());
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
