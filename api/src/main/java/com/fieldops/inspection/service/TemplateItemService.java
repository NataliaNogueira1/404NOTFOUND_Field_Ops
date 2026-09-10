package com.fieldops.inspection.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.inspection.dto.TemplateItemRequest;
import com.fieldops.inspection.dto.TemplateItemResponse;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TemplateItemService {

    private final InspectionTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    public TemplateItemService(InspectionTemplateRepository templateRepository, ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.objectMapper = objectMapper;
    }

    /** Creates a checklist item in the requested section and one-based position. */
    @Transactional
    public TemplateItemResponse create(Long templateId, Long sectionId, TemplateItemRequest request) {
        TemplateSection section = editableSection(templateId, sectionId);
        validateDisplayOrder(request.displayOrder(), section.getItems().size() + 1, sectionId);
        section.getItems().stream()
                .filter(item -> item.getDisplayOrder() >= request.displayOrder())
                .forEach(item -> item.setDisplayOrder(item.getDisplayOrder() + 1));
        TemplateItem item = new TemplateItem();
        item.setSection(section);
        apply(item, request);
        section.getItems().add(item);
        templateRepository.saveAndFlush(section.getTemplate());
        return toResponse(item);
    }

    /** Updates an item and moves it to the requested position within its section. */
    @Transactional
    public TemplateItemResponse update(Long templateId, Long sectionId, Long itemId,
            TemplateItemRequest request) {
        TemplateSection section = editableSection(templateId, sectionId);
        TemplateItem item = findItem(section, itemId);
        validateDisplayOrder(request.displayOrder(), section.getItems().size(), sectionId);
        shiftForMove(section.getItems(), item, request.displayOrder());
        apply(item, request);
        templateRepository.saveAndFlush(section.getTemplate());
        return toResponse(item);
    }

    /** Maps persisted items to the API order and response contract. */
    public List<TemplateItemResponse> toOrderedResponses(List<TemplateItem> items) {
        return items.stream()
                .sorted(Comparator.comparing(TemplateItem::getDisplayOrder))
                .map(this::toResponse)
                .toList();
    }

    private TemplateSection editableSection(Long templateId, Long sectionId) {
        InspectionTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection template not found: " + templateId));
        if (template.getStatus() != InspectionTemplateStatus.DRAFT) {
            throw new BusinessException("Only DRAFT inspection templates can be edited: " + templateId);
        }
        return template.getSections().stream()
                .filter(section -> section.getId().equals(sectionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Template section not found: " + sectionId));
    }

    private TemplateItem findItem(TemplateSection section, Long itemId) {
        return section.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Template item not found: " + itemId));
    }

    private void validateDisplayOrder(int displayOrder, int maximum, Long sectionId) {
        if (displayOrder > maximum) {
            throw new BusinessException("Display order for section " + sectionId
                    + " must be between 1 and " + maximum + ": " + displayOrder);
        }
    }

    private void shiftForMove(List<TemplateItem> items, TemplateItem moved, int targetOrder) {
        int currentOrder = moved.getDisplayOrder();
        if (targetOrder < currentOrder) {
            items.stream().filter(item -> item != moved)
                    .filter(item -> item.getDisplayOrder() >= targetOrder && item.getDisplayOrder() < currentOrder)
                    .forEach(item -> item.setDisplayOrder(item.getDisplayOrder() + 1));
        } else if (targetOrder > currentOrder) {
            items.stream().filter(item -> item != moved)
                    .filter(item -> item.getDisplayOrder() > currentOrder && item.getDisplayOrder() <= targetOrder)
                    .forEach(item -> item.setDisplayOrder(item.getDisplayOrder() - 1));
        }
    }

    private void apply(TemplateItem item, TemplateItemRequest request) {
        item.setQuestion(request.title().trim());
        item.setDescription(normalizeDescription(request.description()));
        item.setResponseType(request.responseType());
        item.setRequired(request.required());
        item.setOptionsJson(serializeOptions(request));
        item.setDisplayOrder(request.displayOrder());
    }

    private String serializeOptions(TemplateItemRequest request) {
        if (request.responseType() != ResponseType.SINGLE_CHOICE) {
            return null;
        }
        List<String> options = request.optionsJson().stream()
                .filter(option -> option != null && !option.isBlank())
                .map(String::trim)
                .toList();
        try {
            return objectMapper.writeValueAsString(options);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize template item options", exception);
        }
    }

    private List<String> deserializeOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not deserialize template item options", exception);
        }
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private TemplateItemResponse toResponse(TemplateItem item) {
        return new TemplateItemResponse(item.getId(), item.getQuestion(), item.getDescription(),
                item.getResponseType(), item.isRequired(), deserializeOptions(item.getOptionsJson()),
                item.getDisplayOrder());
    }
}
