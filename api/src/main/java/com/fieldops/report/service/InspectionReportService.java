package com.fieldops.report.service;

import com.fieldops.audit.model.InspectionResponseHistory;
import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionReportService {

    private final InspectionRepository inspectionRepository;
    private final NonConformityRepository nonConformityRepository;
    private final InspectionResponseHistoryRepository responseHistoryRepository;
    private final InspectionEvidenceRepository inspectionEvidenceRepository;
    private final UserRepository userRepository;
    private final InspectionReportDocument inspectionReportDocument;

    public InspectionReportService(InspectionRepository inspectionRepository,
            NonConformityRepository nonConformityRepository,
            InspectionResponseHistoryRepository responseHistoryRepository,
            InspectionEvidenceRepository inspectionEvidenceRepository,
            UserRepository userRepository,
            InspectionReportDocument inspectionReportDocument) {
        this.inspectionRepository = inspectionRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.responseHistoryRepository = responseHistoryRepository;
        this.inspectionEvidenceRepository = inspectionEvidenceRepository;
        this.userRepository = userRepository;
        this.inspectionReportDocument = inspectionReportDocument;
    }

    /**
     * Generates a PDF from the immutable inspection snapshot and recorded non-conformities.
     * Use from the HTTP report route; this read-only transaction initializes lazy associations.
     *
     * <p>Answers come from the single answer source of truth ({@code inspection_response_history},
     * PBI-088): only the latest version of each item is rendered, so a re-answered item shows its
     * current value rather than every historical version.
     */
    @Transactional(readOnly = true)
    public byte[] generate(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));
        List<NonConformity> nonConformities = nonConformityRepository
                .findByInspectionIdOrderByCreatedAtAsc(inspectionId);
        List<ReportAnswer> answers = latestAnswers(inspectionId);
        List<InspectionEvidence> evidences = inspectionEvidenceRepository
                .findByInspectionIdOrderByCapturedAtAsc(inspectionId);
        return inspectionReportDocument.generate(inspection, nonConformities, answers, evidences);
    }

    private List<ReportAnswer> latestAnswers(Long inspectionId) {
        List<InspectionResponseHistory> entries = responseHistoryRepository
                .findLatestAnswersByInspectionId(inspectionId);
        Map<Long, String> authorNames = resolveAuthorNames(entries);
        return entries.stream()
                .sorted(java.util.Comparator.comparing(InspectionResponseHistory::getSectionOrder)
                        .thenComparing(InspectionResponseHistory::getItemOrder))
                .map(entry -> new ReportAnswer(
                        entry.getSectionTitle(),
                        entry.getItemTitle(),
                        entry.getValue(),
                        entry.getObservation(),
                        entry.getAnsweredAt(),
                        authorNames.get(entry.getAnsweredBy())))
                .toList();
    }

    private Map<Long, String> resolveAuthorNames(List<InspectionResponseHistory> entries) {
        List<Long> authorIds = entries.stream()
                .map(InspectionResponseHistory::getAnsweredBy)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (authorIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName, (first, second) -> first));
    }
}
