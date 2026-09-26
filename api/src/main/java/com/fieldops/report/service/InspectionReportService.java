package com.fieldops.report.service;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.answer.repository.InspectionAnswerRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionReportService {

    private final InspectionRepository inspectionRepository;
    private final NonConformityRepository nonConformityRepository;
    private final InspectionAnswerRepository inspectionAnswerRepository;
    private final InspectionEvidenceRepository inspectionEvidenceRepository;
    private final InspectionReportDocument inspectionReportDocument;

    public InspectionReportService(InspectionRepository inspectionRepository,
            NonConformityRepository nonConformityRepository,
            InspectionAnswerRepository inspectionAnswerRepository,
            InspectionEvidenceRepository inspectionEvidenceRepository,
            InspectionReportDocument inspectionReportDocument) {
        this.inspectionRepository = inspectionRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.inspectionAnswerRepository = inspectionAnswerRepository;
        this.inspectionEvidenceRepository = inspectionEvidenceRepository;
        this.inspectionReportDocument = inspectionReportDocument;
    }

    /**
     * Generates a PDF from the immutable inspection snapshot and recorded non-conformities.
     * Use from the HTTP report route; this read-only transaction initializes lazy associations.
     */
    @Transactional(readOnly = true)
    public byte[] generate(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));
        List<NonConformity> nonConformities = nonConformityRepository
                .findByInspectionIdOrderByCreatedAtAsc(inspectionId);
        List<InspectionAnswer> answers = inspectionAnswerRepository.findHistoryByInspectionId(inspectionId);
        List<InspectionEvidence> evidences = inspectionEvidenceRepository
                .findByInspectionIdOrderByCapturedAtAsc(inspectionId);
        return inspectionReportDocument.generate(inspection, nonConformities, answers, evidences);
    }
}
