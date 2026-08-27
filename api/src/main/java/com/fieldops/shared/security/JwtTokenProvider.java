package com.fieldops.shared.security;

import com.fieldops.config.JwtProperties;
import com.fieldops.user.model.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues and verifies HS256 JWTs. The signing key length is validated at construction so a
 * weak {@code JWT_SECRET} fails fast at startup rather than at the first sign attempt.
 *
 * <p>Two token types exist: short-lived <b>access</b> tokens (role claim, used as Bearer on
 * API routes) and long-lived <b>refresh</b> tokens ({@code typ=refresh}, only accepted by
 * {@code POST /api/v1/auth/refresh}). Type validation prevents one from being replayed as
 * the other.</p>
 */
@Service
public class JwtTokenProvider {

    static final String ROLE_CLAIM = "role";
    static final String TYPE_CLAIM = "typ";
    static final String REFRESH_TYPE = "refresh";
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expirationMillis;
    private final long refreshExpirationMillis;

    public JwtTokenProvider(JwtProperties properties) {
        byte[] secretBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_BYTES
                            + " bytes (256 bits) for HS256; got " + secretBytes.length);
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMillis = properties.expiration().toMillis();
        this.refreshExpirationMillis = properties.refreshExpiration().toMillis();
    }

    public String generateToken(String subject, Role role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject)
                .claim(ROLE_CLAIM, role.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMillis))
                .signWith(key)
                .compact();
    }

    /**
     * Issues a longer-lived refresh JWT, exchanged for new access tokens at
     * {@code POST /api/v1/auth/refresh}. The token itself is not rotated on refresh.
     */
    public String generateRefreshToken(String subject) {
        Date now = new Date();
        return Jwts.builder()
                .subject(subject)
                .claim(TYPE_CLAIM, REFRESH_TYPE)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshExpirationMillis))
                .signWith(key)
                .compact();
    }

    /**
     * @return true when the token has a valid signature, is unexpired, and is <b>not</b> a
     * refresh token — i.e. it may authenticate an API request as a Bearer credential.
     */
    public boolean isValidAccessToken(String token) {
        try {
            return !isRefresh(parse(token));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * @return true when the token has a valid signature, is unexpired, and carries the
     * {@code typ=refresh} claim — i.e. it may only be used to obtain a new access token.
     */
    public boolean isValidRefreshToken(String token) {
        try {
            return isRefresh(parse(token));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractSubject(String token) {
        return parse(token).getSubject();
    }

    public Role extractRole(String token) {
        return Role.valueOf(parse(token).get(ROLE_CLAIM, String.class));
    }

    public long expirationSeconds() {
        return expirationMillis / 1000;
    }

    private boolean isRefresh(Claims claims) {
        return REFRESH_TYPE.equals(claims.get(TYPE_CLAIM, String.class));
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
