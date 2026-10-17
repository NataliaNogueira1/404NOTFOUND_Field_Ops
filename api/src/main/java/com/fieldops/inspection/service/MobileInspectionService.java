package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.dto.MobileStatusUpdateResponse;
import com.fieldops.inspection.mapper.MobileInspectionResponseMapper;
import com.fieldops.inspection.model.*;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.shared.exception.ResourceConflictException;
import com.fieldops.sync.service.IdempotencyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MobileInspectionService {

    private static final String OP_TYPE_STATUS = "INSPECTION_STATUS";

    /** Status transitions a technician may drive from the mobile app. */
    private static final Map<InspectionStatus, Set<InspectionStatus>> MOBILE_TRANSITIONS = Map.of(
            InspectionStatus.ASSIGNED, Set.of(InspectionStatus.IN_PROGRESS),
            InspectionStatus.IN_PROGRESS, Set.of(InspectionStatus.SUBMITTED),
            InspectionStatus.REJECTED, Set.of(InspectionStatus.IN_PROGRESS));

    private final InspectionRepository inspectionRepository;
    private final MobileInspectionResponseMapper responseMapper;
    private final IdempotencyService idempotencyService;

    public MobileInspectionService(InspectionRepository inspectionRepository,
            MobileInspectionResponseMapper responseMapper, IdempotencyService idempotencyService) {
        this.inspectionRepository = inspectionRepository;
        this.responseMapper = responseMapper;
        this.idempotencyService = idempotencyService;
    }

    /**
     * Applies a status transition sent by the technician's device, idempotently (PBI-052).
     * A resend with the same {@code operationId} does not apply the change again; instead it
     * returns ALREADY_APPLIED with the current status. Enforces ownership and the mobile
     * state machine.
     */
    @Transactional
    public MobileStatusUpdateResponse updateStatus(Long inspectionId, UUID operationId,
            InspectionStatus targetStatus, Long baseVersion, Long technicianId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));

        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new BusinessException("Inspection is not assigned to this technician: " + inspectionId);
        }

        // Idempotent resend: the operation was already applied, report current state.
        if (idempotencyService.findProcessed(operationId).isPresent()) {
            return MobileStatusUpdateResponse.alreadyApplied(inspection.getId(), inspection.getStatus());
        }

        if (!inspection.getVersion().equals(baseVersion)) {
            throw new ResourceConflictException("Inspection version conflict: local=" + baseVersion
                    + ", server=" + inspection.getVersion());
        }

        Set<InspectionStatus> allowed = MOBILE_TRANSITIONS.getOrDefault(inspection.getStatus(), Set.of());
        if (!allowed.contains(targetStatus)) {
            throw new BusinessException(
                    "Illegal transition from " + inspection.getStatus() + " to " + targetStatus);
        }

        inspection.setStatus(targetStatus);
        if (targetStatus == InspectionStatus.IN_PROGRESS && inspection.getStartedAt() == null) {
            inspection.setStartedAt(Instant.now());
        }
        inspectionRepository.save(inspection);
        idempotencyService.markProcessed(operationId, OP_TYPE_STATUS, inspection.getId(),
                targetStatus.name());

        return MobileStatusUpdateResponse.applied(inspection.getId(), inspection.getStatus());
    }

    /**
     * Fetch all inspections assigned to a technician that are actionable on mobile.
     */
    @Transactional(readOnly = true)
    public List<MobileInspectionResponse> getInspectionsForTechnician(Long technicianId) {
        List<InspectionStatus> mobileStatuses = List.of(
                InspectionStatus.ASSIGNED,
                InspectionStatus.IN_PROGRESS,
                InspectionStatus.REJECTED
        );

        List<Inspection> inspections = inspectionRepository.findByTechnicianAndStatuses(
                technicianId, mobileStatuses);

        return inspections.stream().map(responseMapper::toResponse).toList();
    }
}
