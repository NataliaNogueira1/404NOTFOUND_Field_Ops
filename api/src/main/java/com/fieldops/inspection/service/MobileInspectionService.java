package com.fieldops.inspection.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.dto.MobileInspectionResponse.*;
import com.fieldops.inspection.model.*;
import com.fieldops.inspection.repository.InspectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class MobileInspectionService {

    private final InspectionRepository inspectionRepository;
    private final ObjectMapper objectMapper;

    public MobileInspectionService(InspectionRepository inspectionRepository, ObjectMapper objectMapper) {
        this.inspectionRepository = inspectionRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Fetch all inspections assigned to a technician that are actionable on mobile.
     */
    @Transactional(readOnly = true)
    public List<MobileInspectionResponse> getInspectionsForTechnician(Long technicianId) {
        List<InspectionStatus> mobileStatuses = List.of(
                InspectionStatus.ASSIGNED,
                InspectionStatus.IN_PROGRESS,
                InspectionStatus.REJECTED
        );

        List<Inspection> inspections = inspectionRepository.findByTechnicianAndStatuses(
                technicianId, mobileStatuses);

        return inspections.stream().map(this::toResponse).toList();
    }

    private MobileInspectionResponse toResponse(Inspection inspection) {
        InspectionTemplate tpl = inspection.getTemplate();

        TemplateDto templateDto = new TemplateDto(
                String.valueOf(tpl.getId()),
                tpl.getTitle(),
                tpl.getCategory(),
                tpl.getVersion(),
                tpl.getSections().stream().map(this::toSectionDto).toList()
        );

        return new MobileInspectionResponse(
                String.valueOf(inspection.getId()),
                inspection.getTitle(),
                String.valueOf(tpl.getId()),
                "cli-" + inspection.getId(),   // simplified — would be real client FK
                inspection.getClientName(),
                "site-" + inspection.getId(),   // simplified
                inspection.getSiteName(),
                "eq-" + inspection.getId(),     // simplified
                inspection.getEquipmentName(),
                String.valueOf(inspection.getTechnician().getId()),
                String.valueOf(inspection.getSupervisor().getId()),
                inspection.getSupervisor().getName(),
                inspection.getStatus().name(),
                inspection.getPriority().name(),
                inspection.getDueDate().toString(),
                inspection.getDueTime() != null ? inspection.getDueTime().toString() : null,
                inspection.getCreatedAt().toString(),
                inspection.getStartedAt() != null ? inspection.getStartedAt().toString() : null,
                inspection.getProgress(),
                inspection.getSupervisorInstructions(),
                templateDto
        );
    }

    private SectionDto toSectionDto(TemplateSection section) {
        return new SectionDto(
                String.valueOf(section.getId()),
                section.getTitle(),
                section.getItems().stream().map(this::toItemDto).toList()
        );
    }

    private ItemDto toItemDto(TemplateItem item) {
        List<String> options = parseOptions(item.getOptions());
        return new ItemDto(
                String.valueOf(item.getId()),
                item.getQuestion(),
                item.getDescription(),
                item.getResponseType().name(),
                item.isRequired(),
                item.isRequireObservationOnFailure(),
                item.isRequireEvidenceOnFailure(),
                options
        );
    }

    private List<String> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
