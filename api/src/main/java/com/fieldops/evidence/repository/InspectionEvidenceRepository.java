package com.fieldops.evidence.repository;

import com.fieldops.evidence.model.InspectionEvidence;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InspectionEvidenceRepository extends JpaRepository<InspectionEvidence, Long> {

    @Query("""
        SELECT evidence FROM InspectionEvidence evidence
        LEFT JOIN FETCH evidence.itemSnapshot snapshot
        JOIN FETCH evidence.uploadedBy
        WHERE evidence.inspection.id = :inspectionId
        ORDER BY evidence.capturedAt, evidence.id
    """)
    List<InspectionEvidence> findByInspectionIdOrderByCapturedAtAsc(@Param("inspectionId") Long inspectionId);
}
