package com.fieldops.answer.service;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.answer.repository.InspectionAnswerRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionAnswerHistoryService {

    private final InspectionRepository inspectionRepository;
    private final InspectionAnswerRepository inspectionAnswerRepository;

    public InspectionAnswerHistoryService(InspectionRepository inspectionRepository,
            InspectionAnswerRepository inspectionAnswerRepository) {
        this.inspectionRepository = inspectionRepository;
        this.inspectionAnswerRepository = inspectionAnswerRepository;
    }

    /**
     * Returns answer changes ordered by the frozen checklist structure and submission time.
     * Use this read-only history rather than the current mobile form for audit screens.
     */
    @Transactional(readOnly = true)
    public List<InspectionAnswerHistoryResponse> history(Long inspectionId) {
        requireInspection(inspectionId);
        return inspectionAnswerRepository.findHistoryByInspectionId(inspectionId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void requireInspection(Long inspectionId) {
        if (inspectionRepository.findById(inspectionId).isEmpty()) {
            throw new ResourceNotFoundException("Inspection not found: " + inspectionId);
        }
    }

    private InspectionAnswerHistoryResponse toResponse(InspectionAnswer answer) {
        return new InspectionAnswerHistoryResponse(answer.getItemSnapshot().getId(),
                answer.getItemSnapshot().getSectionTitle(), answer.getItemSnapshot().getItemTitle(),
                answer.getValue(), answer.getObservation(), answer.getAnsweredAt(),
                answer.getAnsweredBy().getName());
    }
}
