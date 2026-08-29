package com.fieldops.auth.dto;

/**
 * Successful refresh response: a freshly issued access token. The refresh token itself stays
 * valid until its original 7-day expiry, so clients keep using it for subsequent renewals.
 *
 * @param accessToken short-lived access JWT
 * @param expiresIn   access token lifetime in seconds
 */
public record RefreshResponse(
        String accessToken,
        long expiresIn
) {
}
