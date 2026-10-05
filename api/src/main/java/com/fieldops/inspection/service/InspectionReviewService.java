package com.fieldops.inspection.service;

import com.fieldops.audit.model.InspectionResponseHistory;
import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.dto.InspectionReviewResponse;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Assembles the existing immutable inspection snapshot and related review records for the Web UI. */
@Service
public class InspectionReviewService {
    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final InspectionResponseHistoryRepository historyRepository;
    private final InspectionEvidenceRepository evidenceRepository;
    private final NonConformityRepository nonConformityRepository;
    private final UserRepository userRepository;

    public InspectionReviewService(InspectionRepository inspectionRepository, InspectionItemSnapshotRepository snapshotRepository,
            InspectionResponseHistoryRepository historyRepository, InspectionEvidenceRepository evidenceRepository,
            NonConformityRepository nonConformityRepository, UserRepository userRepository) {
        this.inspectionRepository = inspectionRepository;
        this.snapshotRepository = snapshotRepository;
        this.historyRepository = historyRepository;
        this.evidenceRepository = evidenceRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.userRepository = userRepository;
    }

    /** Returns every frozen checklist item, with its latest answer and item-scoped evidence/NCs. */
    @Transactional(readOnly = true)
    public InspectionReviewResponse getReview(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));
        List<InspectionItemSnapshot> snapshots = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspectionId);
        Map<Long, InspectionResponseHistory> answers = latestAnswers(inspectionId);
        Map<Long, String> authors = authorNames(answers.values().stream().toList());
        Map<Long, List<InspectionEvidence>> evidenceBySnapshot = evidenceRepository.findByInspectionIdOrderByCapturedAtAsc(inspectionId)
                .stream().filter(value -> value.getItemSnapshot() != null)
                .collect(Collectors.groupingBy(value -> value.getItemSnapshot().getId()));
        Map<Long, List<NonConformity>> ncBySnapshot = nonConformityRepository.findByInspectionIdOrderByCreatedAtAsc(inspectionId)
                .stream().filter(value -> value.getInspectionItemSnapshot() != null)
                .collect(Collectors.groupingBy(value -> value.getInspectionItemSnapshot().getId()));
        List<InspectionReviewResponse.NonConformity> allNcs = ncBySnapshot.values().stream().flatMap(List::stream)
                .map(this::nonConformity).toList();
        Map<String, List<InspectionItemSnapshot>> bySection = snapshots.stream()
                .collect(Collectors.groupingBy(InspectionItemSnapshot::getSectionTitle, java.util.LinkedHashMap::new, Collectors.toList()));
        List<InspectionReviewResponse.Section> sections = bySection.values().stream().map(items -> new InspectionReviewResponse.Section(
                items.getFirst().getSectionTitle(), items.getFirst().getSectionOrder(), items.stream()
                        .map(snapshot -> item(snapshot, answers.get(snapshot.getSourceTemplateItemId()), authors,
                                evidenceBySnapshot.getOrDefault(snapshot.getId(), List.of()), ncBySnapshot.getOrDefault(snapshot.getId(), List.of())))
                        .toList())).toList();
        return new InspectionReviewResponse(inspection.getId(), inspection.getTitle(), inspection.getStatus(), inspection.getPriority(),
                inspection.getClientName(), inspection.getSiteName(), inspection.getEquipmentName(), inspection.getTechnician().getName(),
                inspection.getDueDate(), inspection.getProgress(), sections, allNcs);
    }

    private Map<Long, InspectionResponseHistory> latestAnswers(Long inspectionId) {
        return historyRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAscAnsweredAtAscIdAsc(inspectionId).stream()
                .collect(Collectors.toMap(InspectionResponseHistory::getItemId, value -> value,
                        (first, second) -> Comparator.comparing(InspectionResponseHistory::getAnsweredAt).compare(first, second) <= 0 ? second : first));
    }

    private Map<Long, String> authorNames(List<InspectionResponseHistory> entries) {
        List<Long> ids = entries.stream().map(InspectionResponseHistory::getAnsweredBy).filter(java.util.Objects::nonNull).distinct().toList();
        return userRepository.findAllById(ids).stream().collect(Collectors.toMap(User::getId, User::getName));
    }

    private InspectionReviewResponse.Item item(InspectionItemSnapshot snapshot, InspectionResponseHistory answer,
            Map<Long, String> authors, List<InspectionEvidence> evidences, List<NonConformity> nonConformities) {
        return new InspectionReviewResponse.Item(snapshot.getId(), snapshot.getItemCode(), snapshot.getItemTitle(), snapshot.getItemDescription(),
                snapshot.getResponseType().name(), snapshot.isRequired(), answer == null ? null : answer.getValue(),
                answer == null ? null : answer.getObservation(), answer == null ? null : answer.getAnsweredAt(),
                answer == null ? null : authors.get(answer.getAnsweredBy()), evidences.stream().map(this::evidence).toList(),
                nonConformities.stream().map(this::nonConformity).toList());
    }

    private InspectionReviewResponse.Evidence evidence(InspectionEvidence value) {
        return new InspectionReviewResponse.Evidence(value.getId(), value.getReference(),
                "/api/v1/inspection-evidences/" + value.getId() + "/content", value.getDescription(), value.getLocation(),
                value.getCapturedAt(), value.getUploadedBy().getName(), value.getItemSnapshot() == null ? null : value.getItemSnapshot().getId());
    }

    private InspectionReviewResponse.NonConformity nonConformity(NonConformity value) {
        return new InspectionReviewResponse.NonConformity(value.getId(), value.getInspectionItemSnapshot() == null ? null : value.getInspectionItemSnapshot().getId(),
                value.getTitle(), value.getDescription(), value.getSeverity().name(), value.getStatus().name(), value.getCreatedAt());
    }
}
