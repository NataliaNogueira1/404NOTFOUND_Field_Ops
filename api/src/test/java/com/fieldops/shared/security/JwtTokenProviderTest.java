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

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(new JwtProperties(SECRET, Duration.ofHours(1)));
    }

    @Test
    void roundTripsSubjectAndRole() {
        String token = jwtTokenProvider.generateToken("tech@fieldops.com", Role.TECHNICIAN);

        assertThat(jwtTokenProvider.isValid(token)).isTrue();
        assertThat(jwtTokenProvider.extractSubject(token)).isEqualTo("tech@fieldops.com");
        assertThat(jwtTokenProvider.extractRole(token)).isEqualTo(Role.TECHNICIAN);
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtTokenProvider.generateToken("admin@fieldops.com", Role.ADMINISTRATOR);

        assertThat(jwtTokenProvider.isValid(token + "tampered")).isFalse();
    }

    @Test
    void rejectsForeignToken() {
        JwtTokenProvider other = new JwtTokenProvider(new JwtProperties(
                "another-secret-another-secret-another-secret!!", Duration.ofHours(1)));
        String foreignToken = other.generateToken("x@fieldops.com", Role.TECHNICIAN);

        assertThat(jwtTokenProvider.isValid(foreignToken)).isFalse();
    }
}
