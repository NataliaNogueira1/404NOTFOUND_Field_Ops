package com.fieldops.nonconformity.dto;

import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Fields used to create or update an administrative non-conformity")
public record NonConformityRequest(
        @NotNull Long inspectionId,
        @NotNull Long itemId,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull NonConformitySeverity severity,
        @NotNull NonConformityStatus status) {
}
