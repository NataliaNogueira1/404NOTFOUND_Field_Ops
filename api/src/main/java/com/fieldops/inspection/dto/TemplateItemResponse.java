package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.ResponseType;
import java.util.List;

public record TemplateItemResponse(
        Long id,
        String title,
        String description,
        ResponseType responseType,
        boolean required,
        List<String> optionsJson,
        Integer displayOrder) {
}
