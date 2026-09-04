package com.fieldops.equipment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request body for updating an existing equipment.
 */
public record UpdateEquipmentRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name,

        @Size(max = 50, message = "Asset number must not exceed 50 characters")
        String assetNumber,

        @Size(max = 100, message = "Serial number must not exceed 100 characters")
        String serialNumber,

        @Size(max = 150, message = "Manufacturer must not exceed 150 characters")
        String manufacturer,

        @Size(max = 150, message = "Model must not exceed 150 characters")
        String model,

        String description,

        @Size(max = 200, message = "QR code must not exceed 200 characters")
        String qrCode,

        LocalDate installedAt
) {
}
