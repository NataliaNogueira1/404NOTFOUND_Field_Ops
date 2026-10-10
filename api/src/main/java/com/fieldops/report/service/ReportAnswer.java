package com.fieldops.report.service;

import java.time.Instant;

/**
 * Answer data the PDF report needs for one checklist item, already flattened from the answer
 * history (PBI-088) and with the author name resolved.
 *
 * <p>Keeps {@link InspectionReportDocument} decoupled from the {@code inspection_response_history}
 * entity and from any user lookup: the service builds these once (resolving author names in a
 * single batch to avoid N+1) and the document only renders them.
 */
public record ReportAnswer(
        String sectionTitle,
        String itemTitle,
        String value,
        String observation,
        Instant answeredAt,
        String answeredBy) {
}
