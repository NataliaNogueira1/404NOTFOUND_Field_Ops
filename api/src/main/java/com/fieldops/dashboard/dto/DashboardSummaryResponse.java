package com.fieldops.dashboard.dto;

import java.util.Map;

/**
 * Response body for {@code GET /api/v1/dashboard/summary}.
 *
 * <p>All counts are non-negative integers. Map keys for {@code byStatus} are
 * {@link com.fieldops.inspection.model.InspectionStatus} names; keys for
 * {@code byCriticality} are {@link com.fieldops.inspection.model.Priority} names.</p>
 *
 * <p>{@code openNonConformities} is always {@code 0} until the NonConformity
 * domain is implemented in the backend (tracked as a future PBI).</p>
 */
public record DashboardSummaryResponse(

        /** Count of inspections grouped by {@code InspectionStatus}. */
        Map<String, Long> byStatus,

        /** Count of non-terminal inspections grouped by {@code Priority}. */
        Map<String, Long> byCriticality,

        /**
         * Number of open (non-terminal, non-cancelled) non-conformities.
         * Returns 0 until the NonConformity domain is available in the API.
         */
        long openNonConformities,

        /** Number of inspections whose dueDate has passed and are not in a terminal state. */
        long overdue) {
}
