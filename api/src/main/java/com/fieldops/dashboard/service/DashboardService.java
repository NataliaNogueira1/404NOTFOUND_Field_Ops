package com.fieldops.dashboard.service;

import com.fieldops.dashboard.dto.DashboardSummaryResponse;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final List<InspectionStatus> TERMINAL_STATUSES = List.of(
            InspectionStatus.APPROVED,
            InspectionStatus.CANCELED,
            InspectionStatus.REJECTED);

    private final InspectionRepository inspectionRepository;

    public DashboardService(InspectionRepository inspectionRepository) {
        this.inspectionRepository = inspectionRepository;
    }

    /**
     * Builds a dashboard summary with four aggregations in three DB queries (no N+1):
     * <ol>
     *   <li>Count by status — one GROUP BY query</li>
     *   <li>Count by priority (non-terminal only) — one GROUP BY query</li>
     *   <li>Count overdue — one COUNT query</li>
     * </ol>
     *
     * @param from       optional start of dueDate range (inclusive)
     * @param to         optional end of dueDate range (inclusive)
     * @param clientName optional exact client name filter (case-insensitive)
     */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(LocalDate from, LocalDate to, String clientName) {

        String normalizedClient = (clientName != null && !clientName.isBlank()) ? clientName.trim() : null;

        // Query 1 — counts by status (all statuses, no restriction)
        Map<String, Long> byStatus = toStatusMap(
                inspectionRepository.countByStatus(from, to, normalizedClient));

        // Query 2 — counts by priority (non-terminal inspections only)
        Map<String, Long> byCriticality = toPriorityMap(
                inspectionRepository.countByPriority(TERMINAL_STATUSES, from, to, normalizedClient));

        // Query 3 — overdue count
        long overdue = inspectionRepository.countOverdue(
                LocalDate.now(), TERMINAL_STATUSES, from, to, normalizedClient);

        // Non-conformities: not yet implemented in the backend domain.
        // Returns 0 until the NonConformity entity and repository are created (future PBI).
        long openNonConformities = 0L;

        return new DashboardSummaryResponse(byStatus, byCriticality, openNonConformities, overdue);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Converts GROUP BY status rows into a Map pre-populated with all 8 statuses (0 if absent). */
    private Map<String, Long> toStatusMap(List<Object[]> rows) {
        Map<String, Long> result = new HashMap<>();
        // Seed all statuses with 0 so the frontend always gets a complete map
        for (InspectionStatus s : InspectionStatus.values()) {
            result.put(s.name(), 0L);
        }
        for (Object[] row : rows) {
            InspectionStatus status = (InspectionStatus) row[0];
            Long count = ((Number) row[1]).longValue();
            result.put(status.name(), count);
        }
        return result;
    }

    /** Converts GROUP BY priority rows into a Map pre-populated with all 4 priorities (0 if absent). */
    private Map<String, Long> toPriorityMap(List<Object[]> rows) {
        Map<String, Long> result = new EnumMap<>(Priority.class);
        // Seed all priorities with 0
        for (Priority p : Priority.values()) {
            result.put(p.name(), 0L);
        }
        for (Object[] row : rows) {
            Priority priority = (Priority) row[0];
            Long count = ((Number) row[1]).longValue();
            result.put(priority.name(), count);
        }
        return result;
    }
}
