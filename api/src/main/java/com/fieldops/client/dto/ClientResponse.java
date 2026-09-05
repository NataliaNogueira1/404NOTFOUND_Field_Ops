package com.fieldops.client.dto;

import com.fieldops.client.model.ClientStatus;

import java.time.Instant;

/**
 * Client representation returned by the API.
 */
public record ClientResponse(
        Long id,
        String name,
        String legalName,
        String document,
        String email,
        String phone,
        ClientStatus status,
        long activeSitesCount,
        Instant createdAt,
        Instant updatedAt,
        Integer version
) {
}
