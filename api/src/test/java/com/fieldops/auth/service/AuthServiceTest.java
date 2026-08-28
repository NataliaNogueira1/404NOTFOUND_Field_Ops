package com.fieldops.auth.service;

import com.fieldops.auth.dto.LoginRequest;
import com.fieldops.auth.dto.LoginResponse;
import com.fieldops.auth.dto.RefreshRequest;
import com.fieldops.auth.dto.RefreshResponse;
import com.fieldops.auth.model.RefreshToken;
import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.config.JwtProperties;
import com.fieldops.shared.exception.InvalidCredentialsException;
import com.fieldops.shared.exception.InvalidRefreshTokenException;
import com.fieldops.shared.security.JwtTokenProvider;
import com.fieldops.user.mapper.UserMapper;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret-32";
    private static final Duration REFRESH_TTL = Duration.ofDays(7);

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private JwtProperties jwtProperties;
    private JwtTokenProvider jwtTokenProvider;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties(SECRET, Duration.ofHours(1), REFRESH_TTL);
        jwtTokenProvider = new JwtTokenProvider(jwtProperties);
        authService = new AuthService(
                userRepository, refreshTokenRepository, passwordEncoder,
                jwtTokenProvider, jwtProperties, userMapper);
    }

    @Test
    void returnsTokensWhenCredentialsAreValid() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.ACTIVE);
        when(userRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("raw-pass", "hashed")).thenReturn(true);
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LoginResponse response = authService.login(new LoginRequest("sup@fieldops.com", "raw-pass"));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(response.expiresIn()).isPositive();
        assertThat(jwtTokenProvider.isValid(response.accessToken())).isTrue();
    }

    @Test
    void persistsRefreshTokenWithSevenDayExpiry() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.ACTIVE);
        when(userRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("raw-pass", "hashed")).thenReturn(true);
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LoginResponse response = authService.login(new LoginRequest("sup@fieldops.com", "raw-pass"));

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken stored = captor.getValue();
        // Must be a UUID: the client treats it as an opaque string; the DB is the source of truth.
        assertThat(UUID.fromString(response.refreshToken())).isNotNull();
        assertThat(stored.getToken()).isEqualTo(response.refreshToken());
        assertThat(stored.getUser()).isEqualTo(user);
        assertThat(stored.getExpiresAt()).isAfter(Instant.now().plus(REFRESH_TTL.minusMinutes(1)));
        assertThat(stored.getExpiresAt()).isBefore(Instant.now().plus(REFRESH_TTL.plusMinutes(1)));
    }

    @Test
    void throwsWhenPasswordDoesNotMatch() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.ACTIVE);
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

    @Test
    void throwsGeneric401WhenUserIsInactive() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.INACTIVE);
        when(userRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("sup@fieldops.com", "raw-pass")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void throwsGeneric401WhenUserIsBlocked() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.BLOCKED);
        when(userRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("sup@fieldops.com", "raw-pass")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void returnsNewAccessTokenWhenRefreshTokenIsStored() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.ACTIVE);
        when(refreshTokenRepository.findByToken("stored-token"))
                .thenReturn(Optional.of(buildRefreshToken(user, REFRESH_TTL)));

        RefreshResponse response = authService.refresh(new RefreshRequest("stored-token"));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.expiresIn()).isPositive();
        assertThat(jwtTokenProvider.isValid(response.accessToken())).isTrue();
        assertThat(jwtTokenProvider.extractSubject(response.accessToken())).isEqualTo("sup@fieldops.com");
    }

    @Test
    void throwsWhenRefreshTokenIsUnknown() {
        when(refreshTokenRepository.findByToken("no-such-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest("no-such-token")))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void throwsAndCleansUpWhenRefreshTokenIsExpired() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.ACTIVE);
        RefreshToken expired = buildRefreshToken(user, Duration.ofSeconds(-60));
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest("expired-token")))
                .isInstanceOf(InvalidRefreshTokenException.class);
        verify(refreshTokenRepository).delete(expired);
    }

    @Test
    void throwsWhenRefreshTokenBelongsToInactiveUser() {
        User user = buildUser(Role.SUPERVISOR, UserStatus.INACTIVE);
        when(refreshTokenRepository.findByToken("stored-token"))
                .thenReturn(Optional.of(buildRefreshToken(user, REFRESH_TTL)));

        assertThatThrownBy(() -> authService.refresh(new RefreshRequest("stored-token")))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void logoutDeletesTheStoredToken() {
        authService.logout(new RefreshRequest("stored-token"));

        verify(refreshTokenRepository).deleteByToken("stored-token");
    }

    private User buildUser(Role role, UserStatus status) {
        User user = new User();
        user.setName("Supervisor");
        user.setEmail("sup@fieldops.com");
        user.setPassword("hashed");
        user.setRole(role);
        user.setStatus(status);
        return user;
    }

    private RefreshToken buildRefreshToken(User user, Duration ttl) {
        RefreshToken token = new RefreshToken();
        token.setToken("stored-token");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plus(ttl));
        return token;
    }
}
