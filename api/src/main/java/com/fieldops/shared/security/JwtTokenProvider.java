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
 */
@Service
public class JwtTokenProvider {

    static final String ROLE_CLAIM = "role";
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expirationMillis;

    public JwtTokenProvider(JwtProperties properties) {
        byte[] secretBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_BYTES
                            + " bytes (256 bits) for HS256; got " + secretBytes.length);
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMillis = properties.expiration().toMillis();
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

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
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

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
