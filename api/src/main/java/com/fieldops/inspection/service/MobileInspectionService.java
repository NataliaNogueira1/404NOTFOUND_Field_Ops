package com.fieldops.inspection.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.dto.MobileInspectionResponse.*;
import com.fieldops.inspection.dto.MobileStatusUpdateResponse;
import com.fieldops.inspection.model.*;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.sync.service.IdempotencyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MobileInspectionService {

    private static final String OP_TYPE_STATUS = "INSPECTION_STATUS";

    /** Status transitions a technician may drive from the mobile app. */
    private static final Map<InspectionStatus, Set<InspectionStatus>> MOBILE_TRANSITIONS = Map.of(
            InspectionStatus.ASSIGNED, Set.of(InspectionStatus.IN_PROGRESS),
            InspectionStatus.IN_PROGRESS, Set.of(InspectionStatus.SUBMITTED),
            InspectionStatus.REJECTED, Set.of(InspectionStatus.IN_PROGRESS));

    private final InspectionRepository inspectionRepository;
    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;

    public MobileInspectionService(InspectionRepository inspectionRepository, ObjectMapper objectMapper,
            IdempotencyService idempotencyService) {
        this.inspectionRepository = inspectionRepository;
        this.objectMapper = objectMapper;
        this.idempotencyService = idempotencyService;
    }

    /**
     * Applies a status transition sent by the technician's device, idempotently (PBI-052).
     * A resend with the same {@code operationId} does not apply the change again; instead it
     * returns ALREADY_APPLIED with the current status. Enforces ownership and the mobile
     * state machine.
     */
    @Transactional
    public MobileStatusUpdateResponse updateStatus(Long inspectionId, UUID operationId,
            InspectionStatus targetStatus, Long technicianId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));

        if (!inspection.getTechnician().getId().equals(technicianId)) {
            throw new BusinessException("Inspection is not assigned to this technician: " + inspectionId);
        }

        // Idempotent resend: the operation was already applied, report current state.
        if (idempotencyService.findProcessed(operationId).isPresent()) {
            return MobileStatusUpdateResponse.alreadyApplied(inspection.getId(), inspection.getStatus());
        }

        Set<InspectionStatus> allowed = MOBILE_TRANSITIONS.getOrDefault(inspection.getStatus(), Set.of());
        if (!allowed.contains(targetStatus)) {
            throw new BusinessException(
                    "Illegal transition from " + inspection.getStatus() + " to " + targetStatus);
        }

        inspection.setStatus(targetStatus);
        if (targetStatus == InspectionStatus.IN_PROGRESS && inspection.getStartedAt() == null) {
            inspection.setStartedAt(Instant.now());
        }
        inspectionRepository.save(inspection);
        idempotencyService.markProcessed(operationId, OP_TYPE_STATUS, inspection.getId(),
                targetStatus.name());

        return MobileStatusUpdateResponse.applied(inspection.getId(), inspection.getStatus());
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
