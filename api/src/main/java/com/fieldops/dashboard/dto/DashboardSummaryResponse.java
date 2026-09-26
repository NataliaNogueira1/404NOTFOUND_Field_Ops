package com.fieldops.dashboard.dto;

import java.util.Map;

/** Aggregated indicators returned by the dashboard summary endpoint. */
public record DashboardSummaryResponse(
        Map<String, Long> byStatus,
        Map<String, Long> byCriticality,
        long openNonConformities,
        long overdue) {
}
