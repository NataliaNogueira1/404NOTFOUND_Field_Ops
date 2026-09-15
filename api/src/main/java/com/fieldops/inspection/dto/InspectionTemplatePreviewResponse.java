package com.fieldops.inspection.dto;

import java.util.List;

public record InspectionTemplatePreviewResponse(
        InspectionTemplateResponse template,
        boolean validForPublication,
        List<String> issues) {
}
