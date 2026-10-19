package com.fieldops.nonconformity.service;

import com.fieldops.nonconformity.dto.NonConformityResponse;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-side queries over non-conformities for the admin/supervisor list endpoint (PBI-228). */
@Service
public class NonConformityQueryService {

    private final NonConformityRepository nonConformityRepository;

    public NonConformityQueryService(NonConformityRepository nonConformityRepository) {
        this.nonConformityRepository = nonConformityRepository;
    }

    /**
     * Returns a paginated list of non-conformities matching the optional filters.
     *
     * <p>The {@code client} filter matches the inspection's denormalized client name exactly and
     * case-insensitively; it is lowercased here because the JPQL compares an already-lowercased bind.
     *
     * @param inspectionId optional inspection filter
     * @param client optional exact client-name filter, case-insensitive
     * @param severity optional severity filter
     * @param status optional status filter (OPEN/CLOSED)
     * @param pageable standard pagination/sort
     */
    @Transactional(readOnly = true)
    public Page<NonConformityResponse> list(
            Long inspectionId,
            String client,
            NonConformitySeverity severity,
            NonConformityStatus status,
            Pageable pageable) {
        String normalizedClientName = normalizeClientName(client);
        return nonConformityRepository
                .search(inspectionId, normalizedClientName, severity, status, pageable)
                .map(this::toResponse);
    }

    private String normalizeClientName(String clientName) {
        // The query compares LOWER(i.clientName) against this raw parameter, so lowercase it here.
        return clientName == null || clientName.isBlank()
                ? null
                : clientName.trim().toLowerCase(Locale.ROOT);
    }

    private NonConformityResponse toResponse(NonConformity nonConformity) {
        Long itemSnapshotId = nonConformity.getInspectionItemSnapshot() == null
                ? null
                : nonConformity.getInspectionItemSnapshot().getId();
        return new NonConformityResponse(
                nonConformity.getId(),
                nonConformity.getInspection().getId(),
                nonConformity.getInspection().getClientName(),
                itemSnapshotId,
                nonConformity.getTitle(),
                nonConformity.getDescription(),
                nonConformity.getSeverity(),
                nonConformity.getStatus(),
                nonConformity.getCreatedAt(),
                nonConformity.getClosedAt());
    }
}
