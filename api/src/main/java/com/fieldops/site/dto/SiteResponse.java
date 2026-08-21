package com.fieldops.site.dto;

import com.fieldops.site.model.SiteStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Inspection site representation returned by the API.
 */
public record SiteResponse(
        Long id,
        Long clientId,
        String clientName,
        String name,
        String description,
        String addressLine,
        String city,
        String state,
        String postalCode,
        BigDecimal latitude,
        BigDecimal longitude,
        String contactName,
        String contactPhone,
        SiteStatus status,
        Instant createdAt,
        Instant updatedAt,
        Integer version
) {
}
