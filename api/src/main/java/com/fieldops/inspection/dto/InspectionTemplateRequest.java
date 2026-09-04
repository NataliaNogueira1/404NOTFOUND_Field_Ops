package com.fieldops.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InspectionTemplateRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must have at most 200 characters")
        String title,

        String description,

        @NotBlank(message = "Category is required")
        @Size(max = 100, message = "Category must have at most 100 characters")
        String category) {
}
