package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionItemSnapshot;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionItemSnapshotRepository extends JpaRepository<InspectionItemSnapshot, Long> {

    /** Frozen checklist items of an inspection, in deterministic section/item order. */
    List<InspectionItemSnapshot> findByInspectionIdOrderBySectionOrderAscItemOrderAsc(Long inspectionId);

    Optional<InspectionItemSnapshot> findByIdAndInspectionId(Long id, Long inspectionId);

    Optional<InspectionItemSnapshot> findByInspectionIdAndSourceTemplateItemId(Long inspectionId,
            Long sourceTemplateItemId);
}
