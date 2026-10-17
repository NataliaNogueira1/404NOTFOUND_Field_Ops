package com.fieldops.inspection.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.dto.MobileInspectionResponse.ItemDto;
import com.fieldops.inspection.dto.MobileInspectionResponse.SectionDto;
import com.fieldops.inspection.dto.MobileInspectionResponse.TemplateDto;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateVersion;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Maps an {@link Inspection} aggregate to the mobile pull contract
 * ({@link MobileInspectionResponse}). Centralizes the single mapping used by both the
 * mobile list (PBI) and the incremental pull (PBI-053), so there is one source of truth.
 *
 * <p>Not MapStruct: the mapping reads JSON rules/options from snapshot columns, which a
 * declarative mapper cannot express without a custom resolver; keeping it manual avoids a
 * larger, riskier conversion. Call it inside a read transaction — it walks LAZY relations
 * ({@code template}, {@code templateVersion}, {@code supervisor}, {@code reviewedBy},
 * {@code itemSnapshots}).
 */
@Component
public class MobileInspectionResponseMapper {

    private final ObjectMapper objectMapper;

    public MobileInspectionResponseMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public MobileInspectionResponse toResponse(Inspection inspection) {
        InspectionTemplate tpl = inspection.getTemplate();
        InspectionTemplateVersion version = inspection.getTemplateVersion();

        TemplateDto templateDto = new TemplateDto(
                String.valueOf(tpl.getId()),
                version != null ? version.getTitleSnapshot() : tpl.getTitle(),
                tpl.getCategory(),
                version != null ? version.getVersionNumber() : tpl.getVersion(),
                toSectionDtos(inspection.getItemSnapshots()));

        return new MobileInspectionResponse(
                String.valueOf(inspection.getId()),
                inspection.getTitle(),
                String.valueOf(tpl.getId()),
                "cli-" + inspection.getId(), // simplified — would be real client FK
                inspection.getClientName(),
                "site-" + inspection.getId(), // simplified
                inspection.getSiteName(),
                "eq-" + inspection.getId(), // simplified
                inspection.getEquipmentName(),
                inspection.getEquipmentQrCode(),
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
                inspection.getRejectionReason(),
                inspection.getReviewedBy() != null ? inspection.getReviewedBy().getName() : null,
                inspection.getReviewedAt() != null ? inspection.getReviewedAt().toString() : null,
                inspection.getVersion(),
                templateDto);
    }

    private List<SectionDto> toSectionDtos(List<InspectionItemSnapshot> snapshots) {
        Map<SectionKey, List<InspectionItemSnapshot>> sections = new LinkedHashMap<>();
        snapshots.stream()
                .sorted(Comparator.comparing(InspectionItemSnapshot::getSectionOrder)
                        .thenComparing(InspectionItemSnapshot::getItemOrder))
                .forEach(snapshot -> sections.computeIfAbsent(
                        new SectionKey(snapshot.getSectionOrder(), snapshot.getSectionTitle()),
                        ignored -> new ArrayList<>())
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
                options);
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
