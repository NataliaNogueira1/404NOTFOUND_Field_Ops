package com.fieldops.auth.controller;

import com.fieldops.auth.dto.LoginRequest;
import com.fieldops.auth.dto.LoginResponse;
import com.fieldops.auth.service.AuthService;
import com.fieldops.shared.security.AuthenticatedUser;
import com.fieldops.user.dto.UserResponse;
import com.fieldops.user.mapper.UserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
 * Authentication endpoints: issue access/refresh JWTs and return the authenticated user's profile.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth")
public class AuthController {

    private static final String LOGIN_200_EXAMPLE = """
            {
              "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWNoQGZpZWxkb3BzLmNvbSIsInJvbGUiOiJURUNITklDSUFOIn0.x",
              "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWNoQGZpZWxkb3BzLmNvbSIsInR5cCI6InJlZnJlc2gifQ.y",
              "expiresIn": 28800,
              "user": {
                "id": 1,
                "name": "Carlos Souza",
                "email": "tech@fieldops.com",
                "role": "TECHNICIAN"
              }
            }
            """;

    private static final String LOGIN_401_EXAMPLE = """
            {
              "timestamp": "2026-08-12T23:00:00Z",
              "status": 401,
              "code": "INVALID_CREDENTIALS",
              "message": "Invalid credentials",
              "path": "/api/v1/auth/login",
              "fieldErrors": []
            }
            """;

    private final AuthService authService;
    private final UserMapper userMapper;

    public AuthController(AuthService authService, UserMapper userMapper) {
        this.authService = authService;
        this.userMapper = userMapper;
    }

    @Operation(summary = "Authenticate and obtain access and refresh tokens")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated",
                    content = @Content(examples = @ExampleObject(value = LOGIN_200_EXAMPLE))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(examples = @ExampleObject(value = LOGIN_401_EXAMPLE)))
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Return the authenticated user's profile", security = @SecurityRequirement(name = "bearer-jwt"))
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return ResponseEntity.ok(userMapper.toResponse(
                principal.getId(), principal.getName(), principal.getUsername(), principal.getRole()));
    }
}
