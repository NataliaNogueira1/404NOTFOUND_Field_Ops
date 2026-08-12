package br.com.fieldops.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Login payload. Validation annotations are the contract, enforced by {@code @Valid}.
 */
public record LoginRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be a valid email address")
        String email,

        @NotBlank(message = "senha is required")
        String senha
) {
}
