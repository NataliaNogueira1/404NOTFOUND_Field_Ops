package br.com.fieldops.api.common.exception;

/**
 * Thrown when a requested resource does not exist. Maps to HTTP 404.
 */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String message) {
        super(message);
    }
}
