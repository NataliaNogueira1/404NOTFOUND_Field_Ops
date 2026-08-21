package com.fieldops.site.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request body for creating a new inspection site.
 */
public record CreateSiteRequest(
        @NotNull(message = "Client ID is required")
        Long clientId,

        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name,

        String description,

        @Size(max = 300, message = "Address must not exceed 300 characters")
        String addressLine,

        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @Size(max = 50, message = "State must not exceed 50 characters")
        String state,

        @Size(max = 20, message = "Postal code must not exceed 20 characters")
        String postalCode,

        BigDecimal latitude,
        BigDecimal longitude,

        @Size(max = 150, message = "Contact name must not exceed 150 characters")
        String contactName,

        @Size(max = 30, message = "Contact phone must not exceed 30 characters")
        String contactPhone
) {
}
