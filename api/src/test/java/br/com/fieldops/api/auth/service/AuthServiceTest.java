package br.com.fieldops.api.auth.service;

import br.com.fieldops.api.auth.dto.LoginRequest;
import br.com.fieldops.api.auth.dto.TokenResponse;
import br.com.fieldops.api.common.exception.CredenciaisInvalidasException;
import br.com.fieldops.api.config.JwtProperties;
import br.com.fieldops.api.security.service.JwtService;
import br.com.fieldops.api.usuario.domain.Perfil;
import br.com.fieldops.api.usuario.domain.Usuario;
import br.com.fieldops.api.usuario.repository.UsuarioRepository;
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
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        JwtService jwtService = new JwtService(new JwtProperties(SECRET, Duration.ofHours(1)));
        authService = new AuthService(usuarioRepository, passwordEncoder, jwtService);
    }

    @Test
    void returnsTokenWhenCredentialsAreValid() {
        Usuario usuario = buildUsuario(Perfil.SUPERVISOR, "hashed");
        when(usuarioRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("raw-pass", "hashed")).thenReturn(true);

        TokenResponse response = authService.login(new LoginRequest("sup@fieldops.com", "raw-pass"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.tokenType()).isEqualTo("Bearer");
    }

    @Test
    void throwsWhenPasswordDoesNotMatch() {
        Usuario usuario = buildUsuario(Perfil.SUPERVISOR, "hashed");
        when(usuarioRepository.findByEmail("sup@fieldops.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("sup@fieldops.com", "wrong")))
                .isInstanceOf(CredenciaisInvalidasException.class);
    }

    @Test
    void throwsWhenUserIsUnknown() {
        when(usuarioRepository.findByEmail("ghost@fieldops.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@fieldops.com", "any")))
                .isInstanceOf(CredenciaisInvalidasException.class);
    }

    private Usuario buildUsuario(Perfil perfil, String senha) {
        Usuario usuario = new Usuario();
        usuario.setNome("Supervisor");
        usuario.setEmail("sup@fieldops.com");
        usuario.setSenha(senha);
        usuario.setPerfil(perfil);
        return usuario;
    }
}
