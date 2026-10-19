package com.fieldops.audit.service;

import com.fieldops.audit.model.InspectionResponseHistory;
import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.sync.dto.AnswerUpsertPayload;
import com.fieldops.sync.service.IdempotencyService;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Applies mobile checklist answers while retaining the immutable answer history. */
@Service
public class InspectionAnswerSyncService {

    private static final String OPERATION_TYPE = "ANSWER_UPSERT";

    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final InspectionResponseHistoryRepository historyRepository;
    private final IdempotencyService idempotencyService;

    public InspectionAnswerSyncService(InspectionRepository inspectionRepository,
            InspectionItemSnapshotRepository snapshotRepository,
            InspectionResponseHistoryRepository historyRepository, IdempotencyService idempotencyService) {
        this.inspectionRepository = inspectionRepository;
        this.snapshotRepository = snapshotRepository;
        this.historyRepository = historyRepository;
        this.idempotencyService = idempotencyService;
    }

    /**
     * Upserts the current answer represented by the latest history entry and marks its operation.
     * A changed answer appends a new immutable version; a repeated operation never adds a version.
     */
    @Transactional
    public Long upsert(AnswerUpsertPayload payload, UUID operationId, Long technicianId) {
        validate(payload);
        Inspection inspection = inspectionRepository.findById(payload.inspectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + payload.inspectionId()));
        assertTechnicianOwns(inspection, technicianId);
        InspectionItemSnapshot item = snapshotRepository
                .findByInspectionIdAndSourceTemplateItemId(inspection.getId(), payload.itemId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection item not found for inspection: " + payload.itemId()));

        InspectionResponseHistory answer = historyRepository.save(InspectionResponseHistory.of(
                inspection.getId(), item.getSourceTemplateItemId(), item.getSectionTitle(), item.getSectionOrder(),
                item.getItemTitle(), item.getItemOrder(), item.getResponseType(), payload.value(),
                trimToNull(payload.observation()), technicianId, null));
        idempotencyService.markProcessed(operationId, OPERATION_TYPE, answer.getId(), payload.value());
        return answer.getId();
    }

    private void validate(AnswerUpsertPayload payload) {
        if (payload == null || payload.inspectionId() == null || payload.itemId() == null || payload.value() == null) {
            throw new BusinessException("ANSWER_UPSERT requires inspectionId, itemId, and value");
        }
    }

    private void assertTechnicianOwns(Inspection inspection, Long technicianId) {
        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new BusinessException("Inspection is not assigned to this technician: " + inspection.getId());
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
