package com.fieldops.sync.service;

import com.fieldops.inspection.mapper.MobileInspectionResponseMapper;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.sync.dto.SyncChange;
import com.fieldops.sync.dto.SyncChangeType;
import com.fieldops.sync.dto.SyncPullResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Serves the mobile incremental pull (PBI-053): returns the inspections assigned to the
 * authenticated technician that changed strictly after the client's cursor, ordered by the
 * monotonic pair {@code (updatedAt, id)}, paginated with an opaque {@code nextCursor}.
 */
@Service
public class SyncPullService {

    static final int DEFAULT_LIMIT = 100;
    static final int MAX_LIMIT = 500;

    private final InspectionRepository inspectionRepository;
    private final MobileInspectionResponseMapper responseMapper;
    private final SyncCursor syncCursor;

    public SyncPullService(InspectionRepository inspectionRepository,
            MobileInspectionResponseMapper responseMapper, SyncCursor syncCursor) {
        this.inspectionRepository = inspectionRepository;
        this.responseMapper = responseMapper;
        this.syncCursor = syncCursor;
    }

    /**
     * Pulls the next page of changes for {@code technicianId}. A {@code null}/blank cursor
     * means first sync (full pull from the start of the ordering). Fetches {@code limit + 1}
     * rows to decide {@code hasMore} without a separate COUNT.
     */
    @Transactional(readOnly = true)
    public SyncPullResponse pull(String cursor, Integer limit, Long technicianId) {
        int pageSize = normalizeLimit(limit);
        SyncCursor.Position from = positionFrom(cursor);

        List<Inspection> rows = inspectionRepository.findChangesForTechnicianAfter(
                technicianId, from.updatedAt(), from.id(), PageRequest.of(0, pageSize + 1));

        boolean hasMore = rows.size() > pageSize;
        List<Inspection> page = hasMore ? rows.subList(0, pageSize) : rows;
        return new SyncPullResponse(toChanges(page), nextCursor(page), hasMore);
    }

    private SyncCursor.Position positionFrom(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return new SyncCursor.Position(Instant.EPOCH, 0L);
        }
        return syncCursor.decode(cursor);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private List<SyncChange> toChanges(List<Inspection> page) {
        return page.stream()
                .map(inspection -> new SyncChange(classify(inspection.getStatus()),
                        responseMapper.toResponse(inspection)))
                .toList();
    }

    private String nextCursor(List<Inspection> page) {
        // Empty delta: nothing new, so there is no position to resume from.
        // Any non-empty page (even the last one) returns the last (updatedAt,id) so the
        // client can resume future syncs from where this delivery ended.
        if (page.isEmpty()) {
            return null;
        }
        Inspection last = page.get(page.size() - 1);
        return syncCursor.encode(last.getUpdatedAt(), last.getId());
    }

    private SyncChangeType classify(InspectionStatus status) {
        return switch (status) {
            case APPROVED, REJECTED -> SyncChangeType.REVIEW;
            case CANCELED -> SyncChangeType.CANCELLATION;
            default -> SyncChangeType.INSPECTION;
        };
    }
}
