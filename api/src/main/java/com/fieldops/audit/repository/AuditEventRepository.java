package com.fieldops.audit.repository;

import com.fieldops.audit.model.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    /** Timeline for one entity, oldest first. */
    List<AuditEvent> findByEntityTypeAndEntityIdOrderByOccurredAtAscIdAsc(String entityType, Long entityId);
}
