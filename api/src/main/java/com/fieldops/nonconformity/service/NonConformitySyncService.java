package com.fieldops.nonconformity.service;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.sync.dto.NonConformityCreatePayload;
import com.fieldops.sync.service.IdempotencyService;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Persists non-conformities received through the mobile synchronization batch. */
@Service
public class NonConformitySyncService {

    private static final String OPERATION_TYPE = "NON_CONFORMITY_CREATE";

    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final NonConformityRepository nonConformityRepository;
    private final IdempotencyService idempotencyService;

    public NonConformitySyncService(InspectionRepository inspectionRepository,
            InspectionItemSnapshotRepository snapshotRepository, NonConformityRepository nonConformityRepository,
            IdempotencyService idempotencyService) {
        this.inspectionRepository = inspectionRepository;
        this.snapshotRepository = snapshotRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.idempotencyService = idempotencyService;
    }

    /** Creates one OPEN non-conformity and records the operation in the same transaction. */
    @Transactional
    public Long create(NonConformityCreatePayload payload, UUID operationId, Long technicianId) {
        NonConformitySeverity severity = validateAndParseSeverity(payload);
        Inspection inspection = inspectionRepository.findById(payload.inspectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + payload.inspectionId()));
        assertTechnicianOwns(inspection, technicianId);
        InspectionItemSnapshot item = snapshotRepository
                .findByInspectionIdAndSourceTemplateItemId(inspection.getId(), payload.itemId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection item not found for inspection: " + payload.itemId()));

        NonConformity saved = nonConformityRepository.save(NonConformity.create(inspection, item,
                payload.title().trim(), payload.description().trim(), severity));
        idempotencyService.markProcessed(operationId, OPERATION_TYPE, saved.getId(), saved.getTitle());
        return saved.getId();
    }

    private NonConformitySeverity validateAndParseSeverity(NonConformityCreatePayload payload) {
        if (payload == null || payload.inspectionId() == null || payload.itemId() == null
                || payload.title() == null || payload.title().isBlank() || payload.description() == null
                || payload.description().isBlank() || payload.severity() == null) {
            throw new BusinessException(
                    "NON_CONFORMITY_CREATE requires inspectionId, itemId, title, description, and severity");
        }
        try {
            return NonConformitySeverity.valueOf(payload.severity());
        } catch (IllegalArgumentException exception) {
            throw new BusinessException("Unknown non-conformity severity: " + payload.severity());
        }
    }

    private void assertTechnicianOwns(Inspection inspection, Long technicianId) {
        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new BusinessException("Inspection is not assigned to this technician: " + inspection.getId());
        }
    }
}
