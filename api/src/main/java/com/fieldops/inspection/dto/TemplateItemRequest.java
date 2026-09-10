package com.fieldops.inspection.dto;

import com.fieldops.inspection.model.ResponseType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record TemplateItemRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must have at most 500 characters")
        String title,
        @Size(max = 1000, message = "Description must have at most 1000 characters")
        String description,
        @NotNull(message = "Response type is required")
        ResponseType responseType,
        boolean required,
        List<String> optionsJson,
        @NotNull(message = "Display order is required")
        @Min(value = 1, message = "Display order must be at least 1")
        Integer displayOrder) {

    @AssertTrue(message = "SINGLE_CHOICE items require at least two non-blank options")
    public boolean isOptionsValid() {
        if (responseType != ResponseType.SINGLE_CHOICE) {
            return true;
        }
        return optionsJson != null
                && optionsJson.stream().filter(option -> option != null && !option.isBlank()).count() >= 2;
    }
}
