package com.fieldops.sync.dto;

import com.fieldops.inspection.dto.MobileInspectionResponse;
import java.time.Instant;
import java.util.List;

/** Incremental mobile pull payload; the cursor is advanced only after local persistence succeeds. */
public record SyncPullResponse(List<MobileInspectionResponse> inspections, Instant nextCursor) {
}
