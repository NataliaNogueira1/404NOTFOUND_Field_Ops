package com.fieldops.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClientRequest(
        @NotBlank(message = "name is required")
        @Size(max = 200, message = "name must have at most 200 characters")
        String name,
        @Size(max = 200, message = "legalName must have at most 200 characters")
        String legalName,
        @Pattern(regexp = "^$|^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$",
                message = "document must match XX.XXX.XXX/XXXX-XX")
        String document,
        @Email(message = "email must be a valid email address")
        @Size(max = 100, message = "email must have at most 100 characters")
        String email,
        @Size(max = 20, message = "phone must have at most 20 characters")
        String phone
) {
}
