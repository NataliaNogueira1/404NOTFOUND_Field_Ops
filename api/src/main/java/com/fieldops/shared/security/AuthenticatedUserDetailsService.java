package com.fieldops.shared.security;

import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads users by email for Spring Security (used by the JWT filter and authentication manager).
 */
@Service
public class AuthenticatedUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AuthenticatedUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return new AuthenticatedUser(user);
    }
}
