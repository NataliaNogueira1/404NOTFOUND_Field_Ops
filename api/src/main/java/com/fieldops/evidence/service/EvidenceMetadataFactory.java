package com.fieldops.evidence.service;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

/**
 * Single source of the evidence business rules shared by the offline-sync and upload paths:
 * owner validation, snapshot-item resolution and location handling. Extracted so neither
 * {@code EvidenceSyncService} nor {@code EvidenceUploadService} duplicates these rules.
 */
@Component
public class EvidenceMetadataFactory {

    private static final BigDecimal MAX_LATITUDE = new BigDecimal("90");
    private static final BigDecimal MAX_LONGITUDE = new BigDecimal("180");

    private final InspectionItemSnapshotRepository snapshotRepository;

    public EvidenceMetadataFactory(InspectionItemSnapshotRepository snapshotRepository) {
        this.snapshotRepository = snapshotRepository;
    }

    /** Fails with a business error when the inspection is not assigned to the acting technician. */
    public void assertTechnicianOwns(Inspection inspection, Long technicianId) {
        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new BusinessException("Inspection is not assigned to this technician: " + inspection.getId());
        }
    }

    /** Resolves the frozen snapshot item bound to the given source template item, or 404s. */
    public InspectionItemSnapshot resolveItem(Inspection inspection, Long itemId) {
        return snapshotRepository.findByInspectionIdAndSourceTemplateItemId(inspection.getId(), itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection item not found for inspection: " + itemId));
    }

    /** Enforces the both-or-neither rule and the geographic bounds for an optional location. */
    public void validateLocation(BigDecimal latitude, BigDecimal longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new BusinessException("Both latitude and longitude are required when location is provided");
        }
        if (latitude != null && (latitude.abs().compareTo(MAX_LATITUDE) > 0
                || longitude.abs().compareTo(MAX_LONGITUDE) > 0)) {
            throw new BusinessException("Location is outside valid latitude/longitude bounds");
        }
    }

    /** Serializes the optional location to the compact JSON persisted on the evidence row. */
    public String locationJson(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null) {
            return null;
        }
        return "{\"latitude\":" + latitude.toPlainString()
                + ",\"longitude\":" + longitude.toPlainString() + "}";
    }
}
