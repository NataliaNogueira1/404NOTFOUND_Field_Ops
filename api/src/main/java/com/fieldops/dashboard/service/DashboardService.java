package com.fieldops.dashboard.service;

import com.fieldops.dashboard.dto.DashboardSummaryResponse;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.model.NonConformityStatus;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private static final List<InspectionStatus> TERMINAL_STATUSES = List.of(
            InspectionStatus.APPROVED,
            InspectionStatus.CANCELED,
            InspectionStatus.REJECTED);

    private final InspectionRepository inspectionRepository;
    private final NonConformityRepository nonConformityRepository;

    public DashboardService(InspectionRepository inspectionRepository, NonConformityRepository nonConformityRepository) {
        this.inspectionRepository = inspectionRepository;
        this.nonConformityRepository = nonConformityRepository;
    }

    /**
     * Returns dashboard indicators using three aggregate queries, avoiding entity loading and N+1 queries.
     *
     * @param from optional inclusive due-date start
     * @param to optional inclusive due-date end
     * @param clientName optional exact client-name filter, case-insensitive
     * @param technicianId optional technician filter
     */
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(
            LocalDate from, LocalDate to, String clientName, Long technicianId) {
        String normalizedClientName = normalizeClientName(clientName);
        Map<String, Long> byStatus = statusCounts(
                inspectionRepository.countByStatus(from, to, normalizedClientName, technicianId));
        Map<String, Long> byCriticality = priorityCounts(inspectionRepository.countByPriority(
                TERMINAL_STATUSES, from, to, normalizedClientName, technicianId));
        long overdue = inspectionRepository.countOverdue(
                LocalDate.now(), TERMINAL_STATUSES, from, to, normalizedClientName, technicianId);
        long openNonConformities = nonConformityRepository.countByStatusAndInspectionFilters(
                NonConformityStatus.OPEN, from, to, normalizedClientName, technicianId);

        return new DashboardSummaryResponse(byStatus, byCriticality, openNonConformities, overdue);
    }

    private String normalizeClientName(String clientName) {
        return clientName == null || clientName.isBlank() ? null : clientName.trim();
    }

    private Map<String, Long> statusCounts(List<Object[]> rows) {
        Map<String, Long> counts = emptyCounts(InspectionStatus.values());
        rows.forEach(row -> counts.put(((InspectionStatus) row[0]).name(), ((Number) row[1]).longValue()));
        return counts;
    }

    private Map<String, Long> priorityCounts(List<Object[]> rows) {
        Map<String, Long> counts = emptyCounts(Priority.values());
        rows.forEach(row -> counts.put(((Priority) row[0]).name(), ((Number) row[1]).longValue()));
        return counts;
    }

    private <T extends Enum<T>> Map<String, Long> emptyCounts(T[] values) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (T value : values) {
            counts.put(value.name(), 0L);
        }
        return counts;
    }
}
