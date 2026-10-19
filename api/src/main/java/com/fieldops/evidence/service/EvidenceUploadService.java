package com.fieldops.evidence.service;

import com.fieldops.evidence.dto.EvidenceUploadRequest;
import com.fieldops.evidence.dto.EvidenceUploadResponse;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.evidence.storage.EvidenceStorage;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.sync.model.ProcessedOperation;
import com.fieldops.sync.service.IdempotencyService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Handles the multipart evidence (photo) upload (PBI-221): unlike {@code EvidenceSyncService}
 * (which only records metadata for a binary stored elsewhere), this service receives the actual
 * bytes, writes them through the storage port and checksums the file content. Owner, item and
 * location rules are shared via {@link EvidenceMetadataFactory}; idempotency is keyed by the
 * client {@code operationId} so a resend returns the prior result without a new file or row.
 */
@Service
public class EvidenceUploadService {

    private static final String OPERATION_TYPE = "EVIDENCE_UPLOAD";

    private final InspectionRepository inspectionRepository;
    private final InspectionEvidenceRepository evidenceRepository;
    private final IdempotencyService idempotencyService;
    private final EvidenceMetadataFactory metadataFactory;
    private final EvidenceStorage storage;

    public EvidenceUploadService(InspectionRepository inspectionRepository,
            InspectionEvidenceRepository evidenceRepository, IdempotencyService idempotencyService,
            EvidenceMetadataFactory metadataFactory, EvidenceStorage storage) {
        this.inspectionRepository = inspectionRepository;
        this.evidenceRepository = evidenceRepository;
        this.idempotencyService = idempotencyService;
        this.metadataFactory = metadataFactory;
        this.storage = storage;
    }

    /**
     * Stores the uploaded photo and persists its metadata for the owning technician.
     * Usage: called by the technician-facing controller after JWT authorization; resending the
     * same {@code operationId} is a no-op that echoes the first result.
     */
    @Transactional
    public EvidenceUploadResponse upload(Long inspectionId, EvidenceUploadRequest request, MultipartFile file,
            Long technicianId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Evidence file is required and must not be empty");
        }
        Optional<ProcessedOperation> prior = idempotencyService.findProcessed(request.operationId());
        if (prior.isPresent()) {
            return resendResult(prior.get());
        }
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));
        metadataFactory.assertTechnicianOwns(inspection, technicianId);
        metadataFactory.validateLocation(request.latitude(), request.longitude());
        InspectionItemSnapshot item = metadataFactory.resolveItem(inspection, request.itemId());

        byte[] content = readBytes(file);
        String reference = storage.store(content, extensionFor(request, file));
        String checksum = checksum(content);
        InspectionEvidence evidence = InspectionEvidence.create(inspection, item, reference, checksum,
                request.description(), metadataFactory.locationJson(request.latitude(), request.longitude()),
                request.capturedAtDevice(), inspection.getTechnician());
        InspectionEvidence saved = evidenceRepository.save(evidence);
        idempotencyService.markProcessed(request.operationId(), OPERATION_TYPE, saved.getId(), saved.getChecksum());
        return new EvidenceUploadResponse(saved.getId(), saved.getChecksum());
    }

    private EvidenceUploadResponse resendResult(ProcessedOperation prior) {
        InspectionEvidence evidence = evidenceRepository.findById(prior.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found: " + prior.getEntityId()));
        return new EvidenceUploadResponse(evidence.getId(), evidence.getChecksum());
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to read uploaded evidence file", exception);
        }
    }

    private String extensionFor(EvidenceUploadRequest request, MultipartFile file) {
        String mimeType = request.mimeType() != null && !request.mimeType().isBlank()
                ? request.mimeType() : file.getContentType();
        if (mimeType == null || !mimeType.contains("/")) {
            return "bin";
        }
        return mimeType.substring(mimeType.indexOf('/') + 1);
    }

    private String checksum(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
