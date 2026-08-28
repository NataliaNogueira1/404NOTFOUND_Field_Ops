package com.fieldops.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.shared.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Returns HTTP 401 (not Spring's default 403) with the shared {@link ErrorResponse} body when a
 * request lacks valid credentials. Clients rely on 401 to trigger the refresh-token flow, so
 * the status must distinguish "unauthenticated" from "authenticated but forbidden".
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        ErrorResponse body = new ErrorResponse(
                Instant.now(), HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED",
                "Authentication required", request.getRequestURI(), List.of());

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
