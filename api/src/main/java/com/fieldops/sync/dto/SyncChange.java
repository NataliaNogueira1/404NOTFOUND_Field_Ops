package com.fieldops.sync.dto;

import com.fieldops.inspection.dto.MobileInspectionResponse;

/**
 * A single change in the incremental pull: the change type plus the full inspection
 * payload the mobile client already knows how to consume (PBI-053).
 */
public record SyncChange(SyncChangeType type, MobileInspectionResponse inspection) {
}
