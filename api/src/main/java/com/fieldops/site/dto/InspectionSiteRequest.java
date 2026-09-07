package com.fieldops.site.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
public record InspectionSiteRequest(
        @NotNull(message = "Client is required") Long clientId,
        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must have at most 200 characters") String name,
        String description,
        @Size(max = 255, message = "Address must have at most 255 characters") String address,
        @Size(max = 100, message = "City must have at most 100 characters") String city,
        @Pattern(regexp = "^$|^[A-Z]{2}$", message = "State must be a two-letter uppercase code") String state,
        @Pattern(regexp = "^$|^\\d{5}-\\d{3}$", message = "Zip code must match XXXXX-XXX") String zipCode,
        @DecimalMin(value = "-90.0", message = "Latitude must be at least -90")
        @DecimalMax(value = "90.0", message = "Latitude must be at most 90") BigDecimal latitude,
        @DecimalMin(value = "-180.0", message = "Longitude must be at least -180")
        @DecimalMax(value = "180.0", message = "Longitude must be at most 180") BigDecimal longitude,
        @Size(max = 100, message = "Contact name must have at most 100 characters") String contactName,
        @Size(max = 20, message = "Contact phone must have at most 20 characters") String contactPhone) {
}
