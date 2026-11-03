package com.fieldops.nonconformity.dto;

import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Write contract for the administrative non-conformity CRUD API. */
public record NonConformityRequest(
        @NotNull Long inspectionId,
        @NotNull Long itemId,
        @NotBlank String title,
        @NotBlank String description,
        @NotNull NonConformitySeverity severity,
        @NotNull NonConformityStatus status) {
}
