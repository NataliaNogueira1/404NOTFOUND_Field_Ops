package br.com.fieldops.api.security.service;

import br.com.fieldops.api.config.JwtProperties;
import br.com.fieldops.api.usuario.domain.Perfil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret-32";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtProperties(SECRET, Duration.ofHours(1)));
    }

    @Test
    void roundTripsSubjectAndPerfil() {
        String token = jwtService.generateToken("tech@fieldops.com", Perfil.TECHNICIAN);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractSubject(token)).isEqualTo("tech@fieldops.com");
        assertThat(jwtService.extractPerfil(token)).isEqualTo(Perfil.TECHNICIAN);
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.generateToken("admin@fieldops.com", Perfil.ADMINISTRATOR);

        assertThat(jwtService.isValid(token + "tampered")).isFalse();
    }

    @Test
    void rejectsForeignToken() {
        JwtService other = new JwtService(new JwtProperties(
                "another-secret-another-secret-another-secret!!", Duration.ofHours(1)));
        String foreignToken = other.generateToken("x@fieldops.com", Perfil.TECHNICIAN);

        assertThat(jwtService.isValid(foreignToken)).isFalse();
    }
}
