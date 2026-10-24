package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.CapturedLocation;
import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.dto.MobileStatusUpdateResponse;
import com.fieldops.inspection.mapper.MobileInspectionResponseMapper;
import com.fieldops.inspection.model.*;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.shared.exception.ResourceConflictException;
import com.fieldops.sync.service.IdempotencyService;
import org.springframework.security.access.AccessDeniedException;
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
            InspectionStatus targetStatus, Long baseVersion, Long technicianId,
            CapturedLocation location) {
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
        // Persist the one-shot GPS location captured at this transition (PBI-045): the
        // start reading on IN_PROGRESS, the conclusion reading on SUBMITTED. Absent when
        // the technician opted out or was denied the permission (RN-059).
        applyLocation(inspection, targetStatus, location);
        inspectionRepository.save(inspection);
        idempotencyService.markProcessed(operationId, OP_TYPE_STATUS, inspection.getId(),
                targetStatus.name());

        return MobileStatusUpdateResponse.applied(inspection.getId(), inspection.getStatus());
    }

    /** Stores the captured location on the start or end slot according to the target status. */
    private void applyLocation(Inspection inspection, InspectionStatus targetStatus,
            CapturedLocation location) {
        if (location == null || !location.hasCoordinates()) {
            return;
        }
        if (targetStatus == InspectionStatus.IN_PROGRESS) {
            inspection.setStartLatitude(location.latitude());
            inspection.setStartLongitude(location.longitude());
            inspection.setStartAccuracy(location.accuracy());
            inspection.setStartCapturedAt(location.capturedAt());
        } else if (targetStatus == InspectionStatus.SUBMITTED) {
            inspection.setEndLatitude(location.latitude());
            inspection.setEndLongitude(location.longitude());
            inspection.setEndAccuracy(location.accuracy());
            inspection.setEndCapturedAt(location.capturedAt());
        }
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

    /**
     * Fetches one inspection detail for its assigned technician (issue #222).
     *
     * <p>Use this after a list sync when the device needs to refresh one local inspection;
     * ownership is verified before the snapshot is exposed.</p>
     */
    @Transactional(readOnly = true)
    public MobileInspectionResponse getInspectionForTechnician(Long inspectionId, Long technicianId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));
        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new AccessDeniedException("Inspection is not assigned to this technician");
        }
        return responseMapper.toResponse(inspection);
    }
}
