package com.fieldops.auth.service;

import com.fieldops.auth.dto.LoginRequest;
import com.fieldops.auth.dto.LoginResponse;
import com.fieldops.shared.exception.InvalidCredentialsException;
import com.fieldops.shared.security.JwtTokenProvider;
import com.fieldops.user.dto.UserResponse;
import com.fieldops.user.mapper.UserMapper;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the authentication flow: look up the user, verify the password, issue access + refresh
 * JWTs. The same error is returned whether the email is unknown or the password is wrong, so a
 * caller cannot enumerate accounts.
 */
@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Invalid credentials";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException(INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException(INVALID_CREDENTIALS);
        }
        String accessToken = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
        UserResponse userResponse = userMapper.toResponse(user);
        return new LoginResponse(accessToken, refreshToken, jwtTokenProvider.expirationSeconds(), userResponse);
    }
}
