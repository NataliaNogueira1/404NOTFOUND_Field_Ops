package com.fieldops.client.dto;

import com.fieldops.client.model.ClientStatus;
import jakarta.validation.constraints.NotNull;

public record ClientStatusRequest(@NotNull(message = "status is required") ClientStatus status) {
}
