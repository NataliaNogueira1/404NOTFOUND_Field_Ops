package com.fieldops.audit.service;

import com.fieldops.audit.dto.AnswerHistoryResponse;
import com.fieldops.audit.model.InspectionResponseHistory;
import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reads and appends the detailed answer history of an inspection (PBI-088).
 *
 * <p>Read-only for the admin endpoint: the trail is insert-only and this service never updates or
 * deletes rows. It complements {@link AuditService} (state changes) without duplicating it — the
 * two cover different concerns (status transitions vs. answer content).
 */
@Service
public class InspectionAnswerHistoryService {

    private final InspectionResponseHistoryRepository historyRepository;
    private final InspectionRepository inspectionRepository;
    private final UserRepository userRepository;

    public InspectionAnswerHistoryService(InspectionResponseHistoryRepository historyRepository,
            InspectionRepository inspectionRepository, UserRepository userRepository) {
        this.historyRepository = historyRepository;
        this.inspectionRepository = inspectionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns the deterministic answer timeline for an inspection (section -> item -> chronological).
     *
     * @throws ResourceNotFoundException (HTTP 404) when the inspection does not exist. An existing
     *     inspection with no recorded answers returns an empty list, never a 404.
     */
    @Transactional(readOnly = true)
    public List<AnswerHistoryResponse> timeline(Long inspectionId) {
        if (!inspectionRepository.existsById(inspectionId)) {
            throw new ResourceNotFoundException("Inspection not found: " + inspectionId);
        }

        List<InspectionResponseHistory> entries = historyRepository
                .findByInspectionIdOrderBySectionOrderAscItemOrderAscAnsweredAtAscIdAsc(inspectionId);

        Map<Long, String> authorNames = resolveAuthorNames(entries);

        return entries.stream()
                .map(entry -> toResponse(entry, authorNames.get(entry.getAnsweredBy())))
                .toList();
    }

    /**
     * Appends one answer version to the trail. Intended to be called when answers reach the
     * server (e.g. from the mobile sync of responses) and by demo seeding. Never mutates prior
     * rows — each call preserves the previous versions of the item.
     */
    @Transactional
    public void record(Long inspectionId, Long itemId, String sectionTitle, Integer sectionOrder, String itemTitle,
            Integer itemOrder, ResponseType responseType, String value, String observation, Long answeredBy,
            Instant answeredAt) {
        historyRepository.save(InspectionResponseHistory.of(inspectionId, itemId, sectionTitle, sectionOrder,
                itemTitle, itemOrder, responseType, value, observation, answeredBy, answeredAt));
    }

    private Map<Long, String> resolveAuthorNames(List<InspectionResponseHistory> entries) {
        List<Long> authorIds = entries.stream()
                .map(InspectionResponseHistory::getAnsweredBy)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        if (authorIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName, (first, second) -> first));
    }

    private AnswerHistoryResponse toResponse(InspectionResponseHistory entry, String authorName) {
        return new AnswerHistoryResponse(
                String.valueOf(entry.getItemId()),
                entry.getSectionTitle(),
                entry.getSectionOrder(),
                entry.getItemTitle(),
                entry.getItemOrder(),
                entry.getResponseType() != null ? entry.getResponseType().name() : null,
                entry.getValue(),
                entry.getObservation(),
                entry.getAnsweredAt(),
                authorName,
                entry.getAnsweredBy());
    }
}
