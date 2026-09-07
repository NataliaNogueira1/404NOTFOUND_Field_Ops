package com.fieldops.equipment.dto;

import com.fieldops.equipment.model.EquipmentStatus;
import jakarta.validation.constraints.NotNull;

public record EquipmentStatusRequest(
        @NotNull(message = "Status is required") EquipmentStatus status) {
}
