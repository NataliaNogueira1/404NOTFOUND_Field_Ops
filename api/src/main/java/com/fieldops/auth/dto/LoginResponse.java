package com.fieldops.auth.dto;

import com.fieldops.user.dto.UserResponse;

/**
 * Successful login response. Matches the documented auth contract so frontends can mock it.
 *
 * @param accessToken  short-lived access JWT (sent as {@code Authorization: Bearer <token>})
 * @param refreshToken opaque UUID persisted server-side; exchanged for new access tokens
 *                     at {@code /auth/refresh} and invalidated by {@code /auth/logout}
 * @param expiresIn    access token lifetime in seconds
 * @param user         authenticated user profile
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        UserResponse user
) {
}
