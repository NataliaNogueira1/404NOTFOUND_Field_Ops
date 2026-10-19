package com.fieldops.audit.repository;

import com.fieldops.audit.model.InspectionResponseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InspectionResponseHistoryRepository extends JpaRepository<InspectionResponseHistory, Long> {

    /**
     * Detailed answer history for one inspection, ordered deterministically:
     * by section, then item, then chronologically (oldest first), with the row id as a final
     * tie-breaker so entries with the same timestamp keep a stable order.
     */
    List<InspectionResponseHistory> findByInspectionIdOrderBySectionOrderAscItemOrderAscAnsweredAtAscIdAsc(
            Long inspectionId);

    /**
     * Latest answer version of every item of one inspection, ordered by section and item.
     *
     * <p>The answer history is append-only (PBI-088): each re-answer inserts a new row. The PDF
     * report (PBI-087) needs only the current value per item, so this collapses the trail with
     * {@code DISTINCT ON (item_id)} keeping the newest row (latest {@code answered_at}, id as
     * tie-breaker). Postgres-native to avoid loading and de-duplicating the full trail in memory,
     * keeping a single source of truth for answers ({@code inspection_response_history}).
     */
    @Query(nativeQuery = true, value = """
            SELECT DISTINCT ON (h.item_id) h.*
            FROM inspection_response_history h
            WHERE h.inspection_id = :inspectionId
            ORDER BY h.item_id, h.answered_at DESC, h.id DESC
            """)
    List<InspectionResponseHistory> findLatestAnswersByInspectionId(@Param("inspectionId") Long inspectionId);
}
