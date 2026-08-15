package com.fieldops.user.repository;

import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
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
class UserRepositoryIT {

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
    private UserRepository userRepository;

    @Test
    void persistsAndFindsByEmail() {
        User user = new User();
        user.setName("Technician");
        user.setEmail("it@fieldops.com");
        user.setPassword("hashed");
        user.setRole(Role.TECHNICIAN);
        User saved = userRepository.saveAndFlush(user);

        Optional<User> found = userRepository.findByEmail("it@fieldops.com");

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
        assertThat(found.get().getRole()).isEqualTo(Role.TECHNICIAN);
        assertThat(found.get().getCreatedAt()).isNotNull();
    }
}
