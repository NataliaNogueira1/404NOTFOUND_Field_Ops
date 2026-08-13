package com.fieldops.shared.security;

import com.fieldops.shared.security.JwtService;
import com.fieldops.shared.security.UsuarioUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Extracts a Bearer JWT from the Authorization header, validates it, and populates the
 * {@link SecurityContextHolder}. Invalid or missing tokens simply leave the context empty —
 * the downstream security chain decides whether the request is authorized.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, UsuarioUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);
        if (token != null && jwtService.isValid(token) && notYetAuthenticated()) {
            String email = jwtService.extractSubject(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            authenticate(request, userDetails);
        }
        filterChain.doFilter(request, response);
    }

    private boolean notYetAuthenticated() {
        return SecurityContextHolder.getContext().getAuthentication() == null;
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    private void authenticate(HttpServletRequest request, UserDetails userDetails) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
