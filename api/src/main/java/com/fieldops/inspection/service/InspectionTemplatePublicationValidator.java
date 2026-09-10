package com.fieldops.inspection.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InspectionTemplatePublicationValidator {

    private final ObjectMapper objectMapper;

    public InspectionTemplatePublicationValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Returns every structural issue that prevents publication. Use before activating a draft. */
    public List<String> validate(InspectionTemplate template) {
        List<String> issues = new ArrayList<>();
        if (template.getTitle() == null || template.getTitle().isBlank()) issues.add("Title is required");
        if (template.getCategory() == null || template.getCategory().isBlank()) issues.add("Category is required");
        if (template.getSections().isEmpty()) issues.add("At least one section is required");
        template.getSections().forEach(section -> validateSection(section, issues));
        return issues;
    }

    private void validateSection(TemplateSection section, List<String> issues) {
        if (section.getItems().isEmpty()) {
            issues.add("Section " + section.getId() + " must contain at least one item");
            return;
        }
        section.getItems().forEach(item -> validateItem(item, issues));
    }

    private void validateItem(TemplateItem item, List<String> issues) {
        if (item.getResponseType() == null) {
            issues.add("Item " + item.getId() + " must define a response type");
        } else if (item.getResponseType() == ResponseType.SINGLE_CHOICE && optionCount(item) < 2) {
            issues.add("SINGLE_CHOICE item " + item.getId() + " requires at least two options");
        }
    }

    private long optionCount(TemplateItem item) {
        if (item.getOptionsJson() == null || item.getOptionsJson().isBlank()) return 0;
        try {
            List<String> options = objectMapper.readValue(item.getOptionsJson(), new TypeReference<>() {});
            return options.stream().filter(option -> option != null && !option.isBlank()).count();
        } catch (JsonProcessingException exception) {
            return 0;
        }
    }
}
