package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionItemSnapshot;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionItemSnapshotRepository extends JpaRepository<InspectionItemSnapshot, Long> {

    Optional<InspectionItemSnapshot> findByIdAndInspectionId(Long id, Long inspectionId);
}
