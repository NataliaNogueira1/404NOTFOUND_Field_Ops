package com.fieldops.sync.repository;

import com.fieldops.sync.model.ProcessedOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProcessedOperationRepository extends JpaRepository<ProcessedOperation, UUID> {

    Optional<ProcessedOperation> findByOperationId(UUID operationId);
}
