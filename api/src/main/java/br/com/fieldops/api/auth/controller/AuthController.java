package br.com.fieldops.api.auth.controller;

import br.com.fieldops.api.auth.dto.LoginRequest;
import br.com.fieldops.api.auth.dto.TokenResponse;
import br.com.fieldops.api.auth.service.AuthService;
import br.com.fieldops.api.security.user.UsuarioUserDetails;
import br.com.fieldops.api.usuario.dto.UsuarioResponse;
import br.com.fieldops.api.usuario.mapper.UsuarioMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication endpoints: issue a JWT and return the authenticated user's profile.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioMapper usuarioMapper;

    public AuthController(AuthService authService, UsuarioMapper usuarioMapper) {
        this.authService = authService;
        this.usuarioMapper = usuarioMapper;
    }

    @Operation(summary = "Authenticate and obtain a JWT")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Return the authenticated user's profile", security = @SecurityRequirement(name = "bearer-jwt"))
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(@AuthenticationPrincipal UsuarioUserDetails principal) {
        return ResponseEntity.ok(usuarioMapper.toResponse(
                principal.getId(), principal.getNome(), principal.getUsername(), principal.getPerfil()));
    }
}
