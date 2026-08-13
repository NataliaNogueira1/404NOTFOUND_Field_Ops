package com.fieldops.auth.service;

import com.fieldops.auth.dto.LoginRequest;
import com.fieldops.auth.dto.TokenResponse;
import com.fieldops.shared.exception.InvalidCredentialsException;
import com.fieldops.shared.security.JwtTokenProvider;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns the authentication flow: look up the user, verify the password, issue a JWT.
 * The same error is returned whether the email is unknown or the password is wrong,
 * so a caller cannot enumerate accounts.
 */
@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Invalid credentials";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException(INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException(INVALID_CREDENTIALS);
        }
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        return TokenResponse.bearer(token, jwtTokenProvider.expirationSeconds());
    }
}
