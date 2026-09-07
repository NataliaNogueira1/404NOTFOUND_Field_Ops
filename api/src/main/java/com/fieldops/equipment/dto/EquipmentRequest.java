package com.fieldops.equipment.dto;

import com.fieldops.equipment.model.EquipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
public record EquipmentRequest(
        @NotNull(message = "Inspection site is required") Long siteId,
        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must have at most 200 characters") String name,
        @Size(max = 50, message = "Asset number must have at most 50 characters") String assetNumber,
        @Size(max = 100, message = "Serial number must have at most 100 characters") String serialNumber,
        @Size(max = 100, message = "Manufacturer must have at most 100 characters") String manufacturer,
        @Size(max = 100, message = "Model must have at most 100 characters") String model,
        String description,
        @NotBlank(message = "QR code is required")
        @Size(max = 100, message = "QR code must have at most 100 characters") String qrCode,
        @NotNull(message = "Status is required") EquipmentStatus status,
        LocalDate installedAt) {
}
