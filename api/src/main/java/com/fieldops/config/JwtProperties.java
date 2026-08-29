package com.fieldops.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * JWT signing configuration, bound from {@code fieldops.security.jwt.*}.
 * The secret must be at least 32 bytes (256 bits) for HS256; enforced in {@code JwtTokenProvider}.
 *
 * @param secret            signing secret (from {@code JWT_SECRET})
 * @param expiration        access token lifetime (from {@code JWT_EXPIRATION}, e.g. {@code 8h})
 * @param refreshExpiration refresh token lifetime (from {@code JWT_REFRESH_EXPIRATION}, e.g. {@code 7d})
 */
@ConfigurationProperties(prefix = "fieldops.security.jwt")
@Validated
public record JwtProperties(
        @NotBlank(message = "JWT_SECRET must not be blank")
        String secret,
        Duration expiration,
        Duration refreshExpiration
) {

    public long expirationSeconds() {
        return expiration == null ? 0 : expiration.toSeconds();
    }
}
