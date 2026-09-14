package com.fieldops.audit.service;

import com.fieldops.audit.dto.AuditEventResponse;
import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.model.AuditEvent;
import com.fieldops.audit.repository.AuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Writes and reads the append-only audit trail (PBI-063).
 * The trail is insert-only: there is no update or delete operation.
 */
@Service
public class AuditService {

    public static final String ENTITY_INSPECTION = "INSPECTION";

    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    /** Records an audit event. Participates in the caller's transaction. */
    @Transactional
    public void record(Long actorId, AuditAction action, String entityType, Long entityId, String detail) {
        repository.save(AuditEvent.of(actorId, action, entityType, entityId, detail));
    }

    /** Convenience overload for inspection events. */
    @Transactional
    public void recordInspection(Long actorId, AuditAction action, Long inspectionId, String detail) {
        record(actorId, action, ENTITY_INSPECTION, inspectionId, detail);
    }

    /** Returns the chronological timeline for one entity. */
    @Transactional(readOnly = true)
    public List<AuditEventResponse> timeline(String entityType, Long entityId) {
        return repository.findByEntityTypeAndEntityIdOrderByOccurredAtAscIdAsc(entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    private AuditEventResponse toResponse(AuditEvent event) {
        return new AuditEventResponse(event.getId(), event.getActorId(), event.getAction(),
                event.getEntityType(), event.getEntityId(), event.getDetail(), event.getOccurredAt());
    }
}
