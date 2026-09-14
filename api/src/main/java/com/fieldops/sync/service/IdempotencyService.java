package com.fieldops.sync.service;

import com.fieldops.sync.model.ProcessedOperation;
import com.fieldops.sync.repository.ProcessedOperationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Idempotency store for offline sync operations (PBI-052).
 * Callers check {@link #findProcessed} before applying an operation and {@link #markProcessed}
 * after a successful apply, both within the same transaction, so a resend of the same
 * {@code operationId} is a no-op.
 */
@Service
public class IdempotencyService {

    private final ProcessedOperationRepository repository;

    public IdempotencyService(ProcessedOperationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<ProcessedOperation> findProcessed(UUID operationId) {
        return repository.findByOperationId(operationId);
    }

    @Transactional
    public void markProcessed(UUID operationId, String operationType, Long entityId, String resultSummary) {
        repository.save(new ProcessedOperation(operationId, operationType, entityId, resultSummary));
    }
}
