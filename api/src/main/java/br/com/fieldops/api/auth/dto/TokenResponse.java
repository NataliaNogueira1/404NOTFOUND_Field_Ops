package br.com.fieldops.api.auth.dto;

/**
 * Token issued after a successful login.
 *
 * @param token     the JWT
 * @param tokenType fixed {@code "Bearer"}
 * @param expiresIn lifetime in seconds
 */
public record TokenResponse(String token, String tokenType, long expiresIn) {

    public static TokenResponse bearer(String token, long expiresIn) {
        return new TokenResponse(token, "Bearer", expiresIn);
    }
}
