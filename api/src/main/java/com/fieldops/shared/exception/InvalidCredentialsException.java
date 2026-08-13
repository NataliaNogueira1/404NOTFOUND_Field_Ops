package com.fieldops.shared.exception;

import org.springframework.security.core.AuthenticationException;

/**
 * Thrown when an authentication attempt fails (bad email or password).
 * Extends Spring Security's {@link AuthenticationException} and maps to HTTP 401.
 */
public class InvalidCredentialsException extends AuthenticationException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
