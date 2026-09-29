package com.fieldops.audit.repository;

import com.fieldops.audit.model.InspectionResponseHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InspectionResponseHistoryRepository extends JpaRepository<InspectionResponseHistory, Long> {

    /**
     * Detailed answer history for one inspection, ordered deterministically:
     * by section, then item, then chronologically (oldest first), with the row id as a final
     * tie-breaker so entries with the same timestamp keep a stable order.
     */
    List<InspectionResponseHistory> findByInspectionIdOrderBySectionOrderAscItemOrderAscAnsweredAtAscIdAsc(
            Long inspectionId);
}
