package com.fieldops.inspection.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.dto.MobileInspectionResponse.*;
import com.fieldops.inspection.model.*;
import com.fieldops.inspection.repository.InspectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
        InspectionTemplateVersion version = inspection.getTemplateVersion();

        TemplateDto templateDto = new TemplateDto(
                String.valueOf(tpl.getId()),
                version != null ? version.getTitleSnapshot() : tpl.getTitle(),
                tpl.getCategory(),
                version != null ? version.getVersionNumber() : tpl.getVersion(),
                toSectionDtos(inspection.getItemSnapshots())
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

    private List<SectionDto> toSectionDtos(List<InspectionItemSnapshot> snapshots) {
        Map<SectionKey, List<InspectionItemSnapshot>> sections = new LinkedHashMap<>();
        snapshots.stream()
                .sorted(Comparator.comparing(InspectionItemSnapshot::getSectionOrder)
                        .thenComparing(InspectionItemSnapshot::getItemOrder))
                .forEach(snapshot -> sections.computeIfAbsent(
                        new SectionKey(snapshot.getSectionOrder(), snapshot.getSectionTitle()), ignored -> new ArrayList<>())
                        .add(snapshot));
        return sections.entrySet().stream()
                .map(entry -> new SectionDto(String.valueOf(entry.getKey().order()), entry.getKey().title(),
                        entry.getValue().stream().map(this::toItemDto).toList()))
                .toList();
    }

    private ItemDto toItemDto(InspectionItemSnapshot snapshot) {
        List<String> options = parseOptions(snapshot.getOptionsJson());
        return new ItemDto(
                String.valueOf(snapshot.getSourceTemplateItemId()),
                snapshot.getItemTitle(),
                snapshot.getItemDescription(),
                snapshot.getResponseType().name(),
                snapshot.isRequired(),
                parseRule(snapshot.getRulesJson(), "observationRequiredOnFailure"),
                parseRule(snapshot.getRulesJson(), "evidenceRequiredOnFailure"),
                options
        );
    }

    private boolean parseRule(String rulesJson, String rule) {
        try {
            return objectMapper.readTree(rulesJson).path(rule).asBoolean(false);
        } catch (Exception exception) {
            return false;
        }
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

    private record SectionKey(Integer order, String title) {
    }
}
