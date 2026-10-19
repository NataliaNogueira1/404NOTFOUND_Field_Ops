package com.fieldops.sync.dto;

import java.util.List;

/**
 * Response for the incremental pull (PBI-053).
 *
 * @param changes    the delta, ordered by (updatedAt ASC, id ASC)
 * @param nextCursor opaque token to resume from; {@code null} when there is nothing more
 * @param hasMore    whether another page is available beyond this one
 */
public record SyncPullResponse(List<SyncChange> changes, String nextCursor, boolean hasMore) {
}
