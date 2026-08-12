package br.com.fieldops.api.usuario.repository;

import br.com.fieldops.api.usuario.domain.Perfil;
import br.com.fieldops.api.usuario.domain.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test against a throwaway PostgreSQL container (Testcontainers).
 * Flyway runs the real migration and {@code ddl-auto=validate} checks the entity matches it.
 * Runs under {@code ./mvnw verify} (Failsafe) and requires Docker.
 */
@Testcontainers
@SpringBootTest
class UsuarioRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("fieldops.security.jwt.secret",
                () -> "it-secret-it-secret-it-secret-it-secret-it-32b");
    }

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void persistsAndFindsByEmail() {
        Usuario usuario = new Usuario();
        usuario.setNome("Technician");
        usuario.setEmail("it@fieldops.com");
        usuario.setSenha("hashed");
        usuario.setPerfil(Perfil.TECHNICIAN);
        Usuario saved = usuarioRepository.saveAndFlush(usuario);

        Optional<Usuario> found = usuarioRepository.findByEmail("it@fieldops.com");

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(found.get().getPerfil()).isEqualTo(Perfil.TECHNICIAN);
        assertThat(found.get().getCreatedAt()).isNotNull();
    }
}
