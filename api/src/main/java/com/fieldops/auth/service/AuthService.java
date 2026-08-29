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
import com.fieldops.user.dto.UserResponse;
import com.fieldops.user.mapper.UserMapper;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Owns the authentication flow: look up the user, verify the password, issue a short-lived
 * access JWT plus a persisted refresh token, renew the access token from a stored refresh
 * token, and delete it on logout. The same error is returned whether the email is unknown,
 * the password is wrong, or the account is not active, so a caller cannot enumerate accounts
 * or learn an account's status.
 */
@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Invalid credentials";
    private static final String INVALID_REFRESH_TOKEN = "Invalid refresh token";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final UserMapper userMapper;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider,
                       JwtProperties jwtProperties, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtProperties = jwtProperties;
        this.userMapper = userMapper;
    }

    /**
     * Authenticates and issues both tokens. The refresh token is a random UUID persisted with
     * a 7-day expiry (configurable via {@code JWT_REFRESH_EXPIRATION}); only ACTIVE users
     * may authenticate.
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException(INVALID_CREDENTIALS));
        if (user.getStatus() != UserStatus.ACTIVE
                || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException(INVALID_CREDENTIALS);
        }

        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = issueRefreshToken(user);
        UserResponse userResponse = userMapper.toResponse(user);
        return new LoginResponse(accessToken, refreshToken.getToken(),
                jwtTokenProvider.expirationSeconds(), userResponse);
    }

    /**
     * Exchanges a stored refresh token for a new access token. Unknown, expired, or
     * deactivated-subject tokens all yield the same 401; expired rows are cleaned up on the
     * way out. The refresh token itself is not rotated.
     */
    @Transactional
    public RefreshResponse refresh(RefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new InvalidRefreshTokenException(INVALID_REFRESH_TOKEN));
        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new InvalidRefreshTokenException(INVALID_REFRESH_TOKEN);
        }
        User user = stored.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidRefreshTokenException(INVALID_REFRESH_TOKEN);
        }

        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        return new RefreshResponse(accessToken, jwtTokenProvider.expirationSeconds());
    }

    /**
     * Deletes the stored refresh token, ending the session's ability to renew. Idempotent:
     * an unknown token still yields 204, so logout never leaks whether a token existed.
     */
    @Transactional
    public void logout(RefreshRequest request) {
        refreshTokenRepository.deleteByToken(request.refreshToken());
    }

    private RefreshToken issueRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plus(jwtProperties.refreshExpiration()));
        return refreshTokenRepository.save(refreshToken);
    }
}
