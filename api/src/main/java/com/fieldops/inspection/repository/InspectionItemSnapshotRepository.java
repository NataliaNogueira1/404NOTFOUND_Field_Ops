package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionItemSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InspectionItemSnapshotRepository extends JpaRepository<InspectionItemSnapshot, Long> {

    /** Frozen checklist items of an inspection, in deterministic section/item order. */
    List<InspectionItemSnapshot> findByInspectionIdOrderBySectionOrderAscItemOrderAsc(Long inspectionId);
}
