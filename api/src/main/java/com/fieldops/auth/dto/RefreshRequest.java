package com.fieldops.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Refresh payload: the long-lived JWT issued at login, exchanged for a new access token.
 */
public record RefreshRequest(
        @NotBlank(message = "refreshToken is required")
        String refreshToken
) {
}
