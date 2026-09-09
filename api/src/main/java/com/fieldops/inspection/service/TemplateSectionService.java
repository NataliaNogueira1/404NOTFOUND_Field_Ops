package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.TemplateSectionRequest;
import com.fieldops.inspection.dto.TemplateSectionResponse;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TemplateSectionService {

    private final InspectionTemplateRepository templateRepository;

    public TemplateSectionService(InspectionTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    /** Creates a section at the requested one-based position and shifts following sections. */
    @Transactional
    public TemplateSectionResponse create(Long templateId, TemplateSectionRequest request) {
        InspectionTemplate template = editableTemplate(templateId);
        validateDisplayOrder(request.displayOrder(), template.getSections().size() + 1, templateId);
        template.getSections().stream()
                .filter(section -> section.getDisplayOrder() >= request.displayOrder())
                .forEach(section -> section.setDisplayOrder(section.getDisplayOrder() + 1));
        TemplateSection section = new TemplateSection();
        section.setTemplate(template);
        apply(section, request);
        template.getSections().add(section);
        templateRepository.saveAndFlush(template);
        return toResponse(section);
    }

    /** Updates section metadata and moves it to the requested one-based position. */
    @Transactional
    public TemplateSectionResponse update(Long templateId, Long sectionId, TemplateSectionRequest request) {
        InspectionTemplate template = editableTemplate(templateId);
        TemplateSection section = findSection(template, sectionId);
        validateDisplayOrder(request.displayOrder(), template.getSections().size(), templateId);
        shiftForMove(template.getSections(), section, request.displayOrder());
        apply(section, request);
        templateRepository.saveAndFlush(template);
        return toResponse(section);
    }

    /** Deletes a draft section and compacts the remaining display order. */
    @Transactional
    public void delete(Long templateId, Long sectionId) {
        InspectionTemplate template = editableTemplate(templateId);
        TemplateSection section = findSection(template, sectionId);
        int removedOrder = section.getDisplayOrder();
        template.getSections().remove(section);
        template.getSections().stream()
                .filter(candidate -> candidate.getDisplayOrder() > removedOrder)
                .forEach(candidate -> candidate.setDisplayOrder(candidate.getDisplayOrder() - 1));
        templateRepository.saveAndFlush(template);
    }

    private InspectionTemplate editableTemplate(Long templateId) {
        InspectionTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection template not found: " + templateId));
        if (template.getStatus() != InspectionTemplateStatus.DRAFT) {
            throw new BusinessException("Only DRAFT inspection templates can be edited: " + templateId);
        }
        return template;
    }

    private TemplateSection findSection(InspectionTemplate template, Long sectionId) {
        return template.getSections().stream()
                .filter(section -> section.getId().equals(sectionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Template section not found: " + sectionId));
    }

    private void validateDisplayOrder(int displayOrder, int maximum, Long templateId) {
        if (displayOrder > maximum) {
            throw new BusinessException("Display order for template " + templateId
                    + " must be between 1 and " + maximum + ": " + displayOrder);
        }
    }

    private void shiftForMove(List<TemplateSection> sections, TemplateSection moved, int targetOrder) {
        int currentOrder = moved.getDisplayOrder();
        if (targetOrder < currentOrder) {
            sections.stream().filter(section -> section != moved)
                    .filter(section -> section.getDisplayOrder() >= targetOrder
                            && section.getDisplayOrder() < currentOrder)
                    .forEach(section -> section.setDisplayOrder(section.getDisplayOrder() + 1));
        } else if (targetOrder > currentOrder) {
            sections.stream().filter(section -> section != moved)
                    .filter(section -> section.getDisplayOrder() > currentOrder
                            && section.getDisplayOrder() <= targetOrder)
                    .forEach(section -> section.setDisplayOrder(section.getDisplayOrder() - 1));
        }
    }

    private void apply(TemplateSection section, TemplateSectionRequest request) {
        section.setTitle(request.title().trim());
        section.setDescription(normalizeDescription(request.description()));
        section.setDisplayOrder(request.displayOrder());
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    public static List<TemplateSectionResponse> toOrderedResponses(List<TemplateSection> sections) {
        return sections.stream()
                .sorted(Comparator.comparing(TemplateSection::getDisplayOrder))
                .map(TemplateSectionService::toResponse)
                .toList();
    }

    private static TemplateSectionResponse toResponse(TemplateSection section) {
        return new TemplateSectionResponse(section.getId(), section.getTitle(), section.getDescription(),
                section.getDisplayOrder(), section.getCreatedAt());
    }
}
