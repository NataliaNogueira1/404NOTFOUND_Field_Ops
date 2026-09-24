package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionItemSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionItemSnapshotRepository extends JpaRepository<InspectionItemSnapshot, Long> {
}
