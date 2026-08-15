package com.fieldops.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * CORS allow-list, bound from {@code fieldops.cors.allowed-origins}
 * (the {@code CORS_ALLOWED_ORIGINS} env var).
 */
@ConfigurationProperties(prefix = "fieldops.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
