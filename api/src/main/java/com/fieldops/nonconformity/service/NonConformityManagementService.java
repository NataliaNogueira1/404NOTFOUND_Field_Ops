package com.fieldops.nonconformity.service;

import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.dto.NonConformityRequest;
import com.fieldops.nonconformity.dto.NonConformityResponse;
import com.fieldops.nonconformity.exception.CriticalEvidenceRequiredException;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.shared.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NonConformityManagementService {
    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final InspectionEvidenceRepository evidenceRepository;
    private final NonConformityRepository nonConformityRepository;
    private final NonConformityQueryService queryService;

    public NonConformityManagementService(InspectionRepository inspectionRepository,
            InspectionItemSnapshotRepository snapshotRepository, InspectionEvidenceRepository evidenceRepository,
            NonConformityRepository nonConformityRepository, NonConformityQueryService queryService) {
        this.inspectionRepository = inspectionRepository;
        this.snapshotRepository = snapshotRepository;
        this.evidenceRepository = evidenceRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.queryService = queryService;
    }

    @Transactional
    public NonConformityResponse create(NonConformityRequest request) {
        Inspection inspection = inspectionRepository.findById(request.inspectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + request.inspectionId()));
        InspectionItemSnapshot item = findItem(request.inspectionId(), request.itemId());
        requireEvidence(request.inspectionId(), item, request.severity());
        NonConformity entity = NonConformity.create(inspection, item, request.title().trim(),
                request.description().trim(), request.severity());
        entity.update(item, request.title().trim(), request.description().trim(), request.severity(), request.status());
        return queryService.toResponse(nonConformityRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public NonConformityResponse get(Long id) {
        return queryService.toResponse(findNonConformity(id));
    }

    @Transactional
    public NonConformityResponse update(Long id, NonConformityRequest request) {
        NonConformity entity = findNonConformity(id);
        InspectionItemSnapshot item = findItem(request.inspectionId(), request.itemId());
        requireEvidence(request.inspectionId(), item, request.severity());
        if (!entity.getInspection().getId().equals(request.inspectionId())) {
            throw new BusinessException("Non-conformity inspection cannot be changed.");
        }
        entity.update(item, request.title().trim(), request.description().trim(), request.severity(), request.status());
        return queryService.toResponse(nonConformityRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        nonConformityRepository.delete(findNonConformity(id));
    }

    private NonConformity findNonConformity(Long id) {
        return nonConformityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Non-conformity not found: " + id));
    }

    private InspectionItemSnapshot findItem(Long inspectionId, Long sourceItemId) {
        return snapshotRepository.findByInspectionIdAndSourceTemplateItemId(inspectionId, sourceItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection item not found: " + sourceItemId));
    }

    private void requireEvidence(Long inspectionId, InspectionItemSnapshot item, NonConformitySeverity severity) {
        if (severity == NonConformitySeverity.CRITICAL
                && !evidenceRepository.existsByInspectionIdAndItemSnapshotId(inspectionId, item.getId())) {
            throw new CriticalEvidenceRequiredException();
        }
    }
}
