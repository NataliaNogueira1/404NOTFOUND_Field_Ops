package com.fieldops.inspection.dto;

import java.time.Instant;

/**
 * Represents a published version of an inspection template, returned by
 * GET /api/v1/inspection-templates/{id}/versions.
 *
 * <p>Since the current domain model stores a single {@code currentVersion} integer
 * on the template, each ACTIVE template exposes exactly one version entry.
 * This contract is intentionally forward-compatible with a future dedicated
 * version-history table.</p>
 */
public record TemplateVersionSummary(
        Long templateId,
        Integer versionNumber,
        boolean activeForNewInspections,
        Instant publishedAt) {
}
