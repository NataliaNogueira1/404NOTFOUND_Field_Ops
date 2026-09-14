package com.fieldops.sync.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Record of a client operation already applied by the server (PBI-052).
 * The {@code operationId} is the client-generated idempotency key; a resend with the same
 * key is recognized and not applied twice. Rows are insert-only.
 */
@Entity
@Table(name = "processed_operations")
public class ProcessedOperation {

    @Id
    @Column(name = "operation_id", nullable = false, updatable = false)
    private UUID operationId;

    @Column(name = "operation_type", nullable = false, length = 40)
    private String operationType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "result_summary", columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "processed_at", nullable = false, updatable = false)
    private Instant processedAt;

    protected ProcessedOperation() {
    }

    public ProcessedOperation(UUID operationId, String operationType, Long entityId, String resultSummary) {
        this.operationId = operationId;
        this.operationType = operationType;
        this.entityId = entityId;
        this.resultSummary = resultSummary;
    }

    @PrePersist
    void onCreate() {
        if (processedAt == null) {
            processedAt = Instant.now();
        }
    }

    public UUID getOperationId() {
        return operationId;
    }

    public String getOperationType() {
        return operationType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public String getResultSummary() {
        return resultSummary;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }
}
