package com.fieldops.shared.exception;

import org.springframework.security.core.AuthenticationException;

/**
 * Thrown when a refresh token is missing, expired, tampered with, or does not belong to a
 * refresh-typed JWT. Extends {@link AuthenticationException} and maps to HTTP 401 with the
 * {@code INVALID_REFRESH_TOKEN} code so clients know to send the user back to login.
 */
public class InvalidRefreshTokenException extends AuthenticationException {

    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}
