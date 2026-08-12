package br.com.fieldops.api.auth.service;

import br.com.fieldops.api.auth.dto.LoginRequest;
import br.com.fieldops.api.auth.dto.TokenResponse;
import br.com.fieldops.api.common.exception.CredenciaisInvalidasException;
import br.com.fieldops.api.security.service.JwtService;
import br.com.fieldops.api.usuario.domain.Usuario;
import br.com.fieldops.api.usuario.repository.UsuarioRepository;
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
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new CredenciaisInvalidasException(INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(request.senha(), usuario.getSenha())) {
            throw new CredenciaisInvalidasException(INVALID_CREDENTIALS);
        }
        String token = jwtService.generateToken(usuario.getEmail(), usuario.getPerfil());
        return TokenResponse.bearer(token, jwtService.expirationSeconds());
    }
}
