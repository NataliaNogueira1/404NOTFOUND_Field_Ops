package com.fieldops.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Optional first-run admin bootstrap configuration.
 * Disabled when either value is blank, so production is never auto-seeded by accident.
 */
@ConfigurationProperties(prefix = "fieldops.bootstrap")
public record BootstrapProperties(String adminEmail, String adminPassword) {

    public boolean isEnabled() {
        return adminEmail != null && !adminEmail.isBlank()
                && adminPassword != null && !adminPassword.isBlank();
    }
}
