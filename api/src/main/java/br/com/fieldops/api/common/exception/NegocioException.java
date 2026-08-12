package br.com.fieldops.api.common.exception;

/**
 * Thrown when a request violates a business rule. Maps to HTTP 422.
 */
public class NegocioException extends RuntimeException {

    public NegocioException(String message) {
        super(message);
    }
}
