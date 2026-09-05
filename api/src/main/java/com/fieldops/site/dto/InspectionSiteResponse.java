package com.fieldops.site.dto;

import com.fieldops.site.model.SiteStatus;

import java.math.BigDecimal;
import java.time.Instant;
public record InspectionSiteResponse(
        Long id,
        Long clientId,
        String clientName,
        String name,
        String description,
        String address,
        String city,
        String state,
        String zipCode,
        BigDecimal latitude,
        BigDecimal longitude,
        String contactName,
        String contactPhone,
        SiteStatus status,
        long equipmentCount,
        Instant createdAt,
        Instant updatedAt,
        Integer version) {
}
