package com.fieldops.nonconformity.service;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.dto.NonConformityRequest;
import com.fieldops.nonconformity.dto.NonConformityResponse;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Administrative CRUD operations for non-conformities. */
@Service
public class NonConformityManagementService {
    private final InspectionRepository inspections;
    private final InspectionItemSnapshotRepository snapshots;
    private final NonConformityRepository nonConformities;
    private final InspectionEvidenceRepository evidences;

    public NonConformityManagementService(InspectionRepository inspections,
            InspectionItemSnapshotRepository snapshots, NonConformityRepository nonConformities,
            InspectionEvidenceRepository evidences) {
        this.inspections = inspections;
        this.snapshots = snapshots;
        this.nonConformities = nonConformities;
        this.evidences = evidences;
    }

    @Transactional
    public NonConformityResponse create(NonConformityRequest request) {
        Inspection inspection = inspection(request.inspectionId());
        InspectionItemSnapshot item = item(inspection.getId(), request.itemId());
        assertCriticalEvidence(inspection, item, request.severity());
        NonConformity value = NonConformity.create(inspection, item, request.title().trim(),
                request.description().trim(), request.severity());
        value.update(value.getTitle(), value.getDescription(), value.getSeverity(), request.status());
        return response(nonConformities.save(value));
    }

    @Transactional(readOnly = true)
    public NonConformityResponse get(Long id) { return response(nonConformity(id)); }

    @Transactional
    public NonConformityResponse update(Long id, NonConformityRequest request) {
        NonConformity value = nonConformity(id);
        InspectionItemSnapshot item = item(value.getInspection().getId(), request.itemId());
        if (!value.getInspection().getId().equals(request.inspectionId())) {
            throw new BusinessException("inspectionId must match the existing non-conformity");
        }
        if (!value.getInspectionItemSnapshot().getId().equals(item.getId())) {
            throw new BusinessException("itemId must match the existing non-conformity");
        }
        assertCriticalEvidence(value.getInspection(), item, request.severity());
        value.update(request.title().trim(), request.description().trim(), request.severity(), request.status());
        return response(value);
    }

    @Transactional
    public void delete(Long id) { nonConformities.delete(nonConformity(id)); }

    private Inspection inspection(Long id) { return inspections.findById(id).orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + id)); }
    private InspectionItemSnapshot item(Long inspectionId, Long itemId) { return snapshots.findByInspectionIdAndSourceTemplateItemId(inspectionId, itemId).orElseThrow(() -> new ResourceNotFoundException("Inspection item not found for inspection: " + itemId)); }
    private NonConformity nonConformity(Long id) { return nonConformities.findById(id).orElseThrow(() -> new ResourceNotFoundException("Non-conformity not found: " + id)); }
    private NonConformityResponse response(NonConformity value) {
        Long itemSnapshotId = value.getInspectionItemSnapshot() == null ? null : value.getInspectionItemSnapshot().getId();
        return new NonConformityResponse(value.getId(), value.getInspection().getId(), value.getInspection().getClientName(), itemSnapshotId, value.getTitle(), value.getDescription(), value.getSeverity(), value.getStatus(), value.getCreatedAt(), value.getClosedAt());
    }
    private void assertCriticalEvidence(Inspection inspection, InspectionItemSnapshot item, NonConformitySeverity severity) {
        if (severity == NonConformitySeverity.CRITICAL && !evidences.existsByInspectionIdAndItemSnapshotId(inspection.getId(), item.getId())) {
            throw new BusinessException("CRITICAL non-conformity requires evidence for item: " + item.getSourceTemplateItemId());
        }
    }
}
