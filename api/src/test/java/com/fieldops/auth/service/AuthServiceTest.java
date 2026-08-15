package com.fieldops.auth.service;

import com.fieldops.auth.dto.LoginRequest;
import com.fieldops.auth.dto.LoginResponse;
import com.fieldops.shared.exception.InvalidCredentialsException;
import com.fieldops.config.JwtProperties;
import com.fieldops.shared.security.JwtTokenProvider;
import com.fieldops.user.mapper.UserMapper;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret-32";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(new JwtProperties(SECRET, Duration.ofHours(1)));
        authService = new AuthService(userRepository, passwordEncoder, jwtTokenProvider, userMapper);
    }

    @Test
    void returnsTokensWhenCredentialsAreValid() {
        User user = buildUser(Role.SUPERVISOR, "hashed");
        when(userRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("raw-pass", "hashed")).thenReturn(true);

        LoginResponse response = authService.login(new LoginRequest("sup@fieldops.com", "raw-pass"));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(response.expiresIn()).isPositive();
    }

    @Test
    void throwsWhenPasswordDoesNotMatch() {
        User user = buildUser(Role.SUPERVISOR, "hashed");
        when(userRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("sup@fieldops.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void throwsWhenUserIsUnknown() {
        when(userRepository.findByEmail("ghost@fieldops.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@fieldops.com", "any")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    private User buildUser(Role role, String password) {
        User user = new User();
        user.setName("Supervisor");
        user.setEmail("sup@fieldops.com");
        user.setPassword(password);
        user.setRole(role);
        return user;
    }
}
