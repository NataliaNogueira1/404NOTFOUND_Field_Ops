package com.fieldops.inspection.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TemplateSectionRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must have at most 200 characters")
        String title,
        String description,
        @NotNull(message = "Display order is required")
        @Min(value = 1, message = "Display order must be at least 1")
        Integer displayOrder) {
}
