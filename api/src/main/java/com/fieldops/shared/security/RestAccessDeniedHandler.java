package com.fieldops.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldops.shared.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Returns HTTP 403 with the shared {@link ErrorResponse} body when an authenticated user
 * lacks the role a route requires. The body is deliberately generic — it never states
 * which role was expected nor echoes user data, so it cannot leak authorization details.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {

        ErrorResponse body = new ErrorResponse(
                Instant.now(), HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN",
                "Access denied", request.getRequestURI(), List.of());

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
