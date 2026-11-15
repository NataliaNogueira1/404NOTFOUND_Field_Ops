package com.fieldops.evidence.service;

import com.fieldops.evidence.dto.EvidenceDownloadUrlResponse;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.evidence.storage.EvidenceStorage;
import com.fieldops.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tells the Web Admin where to load an evidence image (#310). With a private S3 bucket it hands out
 * a short-lived presigned link so the browser reads the object directly; with local disk it points
 * back at the authenticated content endpoint, so the review screen works in every environment.
 */
@Service
public class EvidenceDownloadUrlService {
    private final InspectionEvidenceRepository repository;
    private final EvidenceStorage storage;

    public EvidenceDownloadUrlService(InspectionEvidenceRepository repository, EvidenceStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    /**
     * Resolves the download location of an evidence.
     * Usage: called after the supervisor/admin authorization; never log the returned presigned URL,
     * it grants read access to the object until it expires.
     */
    @Transactional(readOnly = true)
    public EvidenceDownloadUrlResponse resolve(Long evidenceId) {
        InspectionEvidence evidence = repository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection evidence not found: " + evidenceId));
        return storage.temporaryDownloadUrl(evidence.getReference())
                .map(temporary -> new EvidenceDownloadUrlResponse(temporary.url().toString(), temporary.expiresAt(), true))
                .orElseGet(() -> new EvidenceDownloadUrlResponse(contentPath(evidence.getId()), null, false));
    }

    private String contentPath(Long evidenceId) {
        return "/api/v1/inspection-evidences/" + evidenceId + "/content";
    }
}
