package com.fieldops.sync.service;

import com.fieldops.evidence.service.EvidenceSyncService;
import com.fieldops.audit.service.InspectionAnswerSyncService;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.service.MobileInspectionService;
import com.fieldops.nonconformity.service.NonConformitySyncService;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceConflictException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.sync.dto.EvidenceCreatePayload;
import com.fieldops.sync.dto.NonConformityCreatePayload;
import com.fieldops.sync.dto.AnswerUpsertPayload;
import com.fieldops.sync.dto.SyncOperationRequest;
import com.fieldops.sync.dto.SyncOperationResult;
import com.fieldops.sync.dto.SyncPushRequest;
import com.fieldops.sync.dto.SyncPushResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Applies a batch of sync operations respecting dependencies (PBI-051).
 * Operations are processed in dependency order; an operation whose dependency was not
 * resolved in this batch (and is not already processed) is DEFERRED for the next cycle.
 * Each operation is idempotent through {@link IdempotencyService}.
 */
@Service
public class SyncBatchService {

    private final IdempotencyService idempotencyService;
    private final MobileInspectionService mobileInspectionService;
    private final EvidenceSyncService evidenceSyncService;
    private final InspectionAnswerSyncService answerSyncService;
    private final NonConformitySyncService nonConformitySyncService;
    private final ObjectMapper objectMapper;

    public SyncBatchService(IdempotencyService idempotencyService,
            MobileInspectionService mobileInspectionService, EvidenceSyncService evidenceSyncService,
            InspectionAnswerSyncService answerSyncService, NonConformitySyncService nonConformitySyncService,
            ObjectMapper objectMapper) {
        this.idempotencyService = idempotencyService;
        this.mobileInspectionService = mobileInspectionService;
        this.evidenceSyncService = evidenceSyncService;
        this.answerSyncService = answerSyncService;
        this.nonConformitySyncService = nonConformitySyncService;
        this.objectMapper = objectMapper;
    }

    public SyncPushResponse push(SyncPushRequest request, Long technicianId) {
        List<SyncOperationRequest> ordered = orderByDependencies(request.operations());

        // operationIds resolved in THIS batch (applied or already-applied), so dependents can proceed.
        Set<UUID> resolved = new HashSet<>();
        List<SyncOperationResult> results = new ArrayList<>();

        for (SyncOperationRequest op : ordered) {
            SyncOperationResult result = processOne(op, technicianId, resolved);
            if (result.status() == SyncOperationResult.Status.APPLIED
                    || result.status() == SyncOperationResult.Status.ALREADY_APPLIED) {
                resolved.add(op.operationId());
            }
            results.add(result);
        }

        // Restore the original submission order in the response.
        Map<UUID, SyncOperationResult> byId = new LinkedHashMap<>();
        results.forEach(r -> byId.put(r.operationId(), r));
        List<SyncOperationResult> inSubmissionOrder = request.operations().stream()
                .map(op -> byId.get(op.operationId())).toList();
        return new SyncPushResponse(inSubmissionOrder);
    }

    private SyncOperationResult processOne(SyncOperationRequest op, Long technicianId, Set<UUID> resolved) {
        // Idempotent resend: already applied in a previous batch.
        if (idempotencyService.findProcessed(op.operationId()).isPresent()) {
            return SyncOperationResult.alreadyApplied(op.operationId());
        }

        // Any dependency not resolved in this batch nor previously processed -> wait next cycle.
        for (UUID dependencyId : op.dependencyIds()) {
            boolean resolvedNow = resolved.contains(dependencyId);
            boolean resolvedBefore = idempotencyService.findProcessed(dependencyId).isPresent();
            if (!resolvedNow && !resolvedBefore) {
                return SyncOperationResult.deferred(op.operationId(),
                        "Unresolved dependency: " + dependencyId);
            }
        }

        try {
            return switch (op.type()) {
                case INSPECTION_STATUS -> applyInspectionStatus(op, technicianId);
                case ANSWER_UPSERT -> applyAnswerUpsert(op, technicianId);
                case EVIDENCE_CREATE -> applyEvidenceCreate(op, technicianId);
                case NON_CONFORMITY_CREATE -> applyNonConformityCreate(op, technicianId);
            };
        } catch (ResourceConflictException ex) {
            return SyncOperationResult.conflict(op.operationId(), ex.getMessage());
        } catch (ResourceNotFoundException | BusinessException ex) {
            return SyncOperationResult.failed(op.operationId(), ex.getMessage());
        }
    }

    private SyncOperationResult applyNonConformityCreate(SyncOperationRequest op, Long technicianId) {
        if (op.payload() == null) {
            return SyncOperationResult.failed(op.operationId(), "NON_CONFORMITY_CREATE requires a payload");
        }
        NonConformityCreatePayload payload;
        try {
            payload = objectMapper.treeToValue(op.payload(), NonConformityCreatePayload.class);
        } catch (JsonProcessingException exception) {
            return SyncOperationResult.failed(op.operationId(), "Invalid NON_CONFORMITY_CREATE payload");
        }
        try {
            nonConformitySyncService.create(payload, op.operationId(), technicianId);
            return SyncOperationResult.applied(op.operationId());
        } catch (ResourceNotFoundException | BusinessException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            return SyncOperationResult.failed(op.operationId(), "Unable to persist non-conformity");
        }
    }

    private SyncOperationResult applyAnswerUpsert(SyncOperationRequest op, Long technicianId) {
        if (op.payload() == null) {
            return SyncOperationResult.failed(op.operationId(), "ANSWER_UPSERT requires a payload");
        }
        AnswerUpsertPayload payload;
        try {
            payload = objectMapper.treeToValue(op.payload(), AnswerUpsertPayload.class);
        } catch (JsonProcessingException exception) {
            return SyncOperationResult.failed(op.operationId(), "Invalid ANSWER_UPSERT payload");
        }
        try {
            answerSyncService.upsert(payload, op.operationId(), technicianId);
            return SyncOperationResult.applied(op.operationId());
        } catch (ResourceNotFoundException | BusinessException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            return SyncOperationResult.failed(op.operationId(), "Unable to persist checklist answer");
        }
    }

    private SyncOperationResult applyEvidenceCreate(SyncOperationRequest op, Long technicianId) {
        if (op.payload() == null) {
            return SyncOperationResult.failed(op.operationId(), "EVIDENCE_CREATE requires a payload");
        }
        EvidenceCreatePayload payload;
        try {
            payload = objectMapper.treeToValue(op.payload(), EvidenceCreatePayload.class);
        } catch (JsonProcessingException exception) {
            return SyncOperationResult.failed(op.operationId(), "Invalid EVIDENCE_CREATE payload");
        }
        try {
            evidenceSyncService.create(payload, op.operationId(), technicianId);
            return SyncOperationResult.applied(op.operationId());
        } catch (ResourceNotFoundException | BusinessException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            return SyncOperationResult.failed(op.operationId(), "Unable to persist evidence metadata");
        }
    }

    private SyncOperationResult applyInspectionStatus(SyncOperationRequest op, Long technicianId) {
        JsonNode payload = op.payload();
        if (payload == null || !payload.hasNonNull("inspectionId") || !payload.hasNonNull("status")) {
            return SyncOperationResult.failed(op.operationId(),
                    "INSPECTION_STATUS requires inspectionId and status");
        }
        Long inspectionId = payload.get("inspectionId").asLong();
        InspectionStatus status;
        try {
            status = InspectionStatus.valueOf(payload.get("status").asText());
        } catch (IllegalArgumentException ex) {
            return SyncOperationResult.failed(op.operationId(),
                    "Unknown status: " + payload.get("status").asText());
        }

        var response = mobileInspectionService.updateStatus(
                inspectionId, op.operationId(), status, op.baseVersion(), technicianId);
        return response.applied()
                ? SyncOperationResult.applied(op.operationId())
                : SyncOperationResult.alreadyApplied(op.operationId());
    }

    /**
     * Topological order by dependencyIds. Operations whose dependencies are not present in the
     * batch are kept in submission order (their dependency may already be on the server).
     * Cycles are broken by falling back to submission order for the remaining operations.
     */
    private List<SyncOperationRequest> orderByDependencies(List<SyncOperationRequest> operations) {
        Map<UUID, SyncOperationRequest> byId = new LinkedHashMap<>();
        operations.forEach(op -> byId.put(op.operationId(), op));

        List<SyncOperationRequest> ordered = new ArrayList<>();
        Set<UUID> placed = new HashSet<>();
        Set<UUID> visiting = new HashSet<>();

        for (SyncOperationRequest op : operations) {
            visit(op, byId, placed, visiting, ordered);
        }
        return ordered;
    }

    private void visit(SyncOperationRequest op, Map<UUID, SyncOperationRequest> byId,
            Set<UUID> placed, Set<UUID> visiting, List<SyncOperationRequest> ordered) {
        if (placed.contains(op.operationId()) || visiting.contains(op.operationId())) {
            return; // already placed, or a cycle — stop recursing
        }
        visiting.add(op.operationId());
        for (UUID dependencyId : op.dependencyIds()) {
            SyncOperationRequest dependency = byId.get(dependencyId);
            if (dependency != null) {
                visit(dependency, byId, placed, visiting, ordered);
            }
        }
        visiting.remove(op.operationId());
        if (placed.add(op.operationId())) {
            ordered.add(op);
        }
    }
}
