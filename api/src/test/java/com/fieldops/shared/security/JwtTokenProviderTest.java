package com.fieldops.shared.security;

import com.fieldops.config.JwtProperties;
import com.fieldops.user.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret-32";

    private JwtTokenProvider jwtTokenProvider;

    private JwtTokenProvider providerWithRefreshExpiration(Duration refreshExpiration) {
        return new JwtTokenProvider(new JwtProperties(SECRET, Duration.ofHours(1), refreshExpiration));
    }

    @BeforeEach
    void setUp() {
        jwtTokenProvider = providerWithRefreshExpiration(Duration.ofDays(7));
    }

    @Test
    void roundTripsSubjectAndRole() {
        String token = jwtTokenProvider.generateToken("tech@fieldops.com", Role.TECHNICIAN);

        assertThat(jwtTokenProvider.isValidAccessToken(token)).isTrue();
        assertThat(jwtTokenProvider.extractSubject(token)).isEqualTo("tech@fieldops.com");
        assertThat(jwtTokenProvider.extractRole(token)).isEqualTo(Role.TECHNICIAN);
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtTokenProvider.generateToken("admin@fieldops.com", Role.ADMINISTRATOR);

        assertThat(jwtTokenProvider.isValidAccessToken(token + "tampered")).isFalse();
    }

    @Test
    void rejectsForeignToken() {
        JwtTokenProvider other = new JwtTokenProvider(new JwtProperties(
                "another-secret-another-secret-another-secret!!", Duration.ofHours(1), Duration.ofDays(7)));
        String foreignToken = other.generateToken("x@fieldops.com", Role.TECHNICIAN);

        assertThat(jwtTokenProvider.isValidAccessToken(foreignToken)).isFalse();
    }

    @Test
    void acceptsRefreshTokenOnlyThroughTheRefreshFlow() {
        String token = jwtTokenProvider.generateRefreshToken("tech@fieldops.com");

        assertThat(jwtTokenProvider.isValidRefreshToken(token)).isTrue();
        assertThat(jwtTokenProvider.isValidAccessToken(token)).isFalse();
        assertThat(jwtTokenProvider.extractSubject(token)).isEqualTo("tech@fieldops.com");
    }

    @Test
    void rejectsAccessTokenAsRefreshToken() {
        String token = jwtTokenProvider.generateToken("tech@fieldops.com", Role.TECHNICIAN);

        assertThat(jwtTokenProvider.isValidRefreshToken(token)).isFalse();
    }

    @Test
    void rejectsExpiredRefreshToken() {
        JwtTokenProvider expired = providerWithRefreshExpiration(Duration.ofSeconds(-60));
        String token = expired.generateRefreshToken("tech@fieldops.com");

        assertThat(expired.isValidRefreshToken(token)).isFalse();
    }
}
