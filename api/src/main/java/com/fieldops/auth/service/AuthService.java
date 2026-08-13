package com.fieldops.auth.service;

import com.fieldops.auth.dto.LoginRequest;
import com.fieldops.auth.dto.TokenResponse;
import com.fieldops.shared.exception.CredenciaisInvalidasException;
import com.fieldops.shared.security.JwtTokenProvider;
import com.fieldops.user.model.Usuario;
import com.fieldops.user.repository.UsuarioRepository;
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

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new CredenciaisInvalidasException(INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.senha(), usuario.getSenha())) {
            throw new CredenciaisInvalidasException(INVALID_CREDENTIALS);
        }
        String token = jwtTokenProvider.generateToken(usuario.getEmail(), usuario.getPerfil());
        return TokenResponse.bearer(token, jwtTokenProvider.expirationSeconds());
    }
}
