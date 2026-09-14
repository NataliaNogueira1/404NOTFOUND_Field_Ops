package com.fieldops.audit.dto;

import com.fieldops.audit.model.AuditAction;

import java.time.Instant;

/**
 * One entry in an entity's audit timeline (PBI-063).
 */
public record AuditEventResponse(
        Long id,
        Long actorId,
        AuditAction action,
        String entityType,
        Long entityId,
        String detail,
        Instant occurredAt) {
}
