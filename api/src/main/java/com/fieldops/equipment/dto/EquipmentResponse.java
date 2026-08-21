package com.fieldops.equipment.dto;

import com.fieldops.equipment.model.EquipmentStatus;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Equipment representation returned by the API.
 */
public record EquipmentResponse(
        Long id,
        Long siteId,
        String siteName,
        Long clientId,
        String clientName,
        String name,
        String assetNumber,
        String serialNumber,
        String manufacturer,
        String model,
        String description,
        String qrCode,
        EquipmentStatus status,
        LocalDate installedAt,
        Instant createdAt,
        Instant updatedAt,
        Integer version
) {
}
