package com.fieldops.config;

import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates intentionally fictitious accounts for the local dev profile only.
 * Production never loads this runner because of {@link Profile}.
 */
@Component
@Profile("dev")
public class DevUsersBootstrapRunner implements ApplicationRunner {

    private final DevUsersProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DevUsersBootstrapRunner(DevUsersProperties properties, UserRepository userRepository,
                                   PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        createIfMissing(properties.admin(), Role.ADMINISTRATOR);
        createIfMissing(properties.supervisor(), Role.SUPERVISOR);
        createIfMissing(properties.technician(), Role.TECHNICIAN);
    }

    private void createIfMissing(DevUserProperties account, Role role) {
        if (userRepository.existsByEmail(account.email())) {
            return;
        }
        User user = new User();
        user.setName(account.name());
        user.setEmail(account.email());
        user.setPassword(passwordEncoder.encode(account.password()));
        user.setRole(role);
        userRepository.save(user);
    }
}

@ConfigurationProperties(prefix = "fieldops.bootstrap.dev-users")
record DevUsersProperties(boolean enabled, DevUserProperties admin,
                          DevUserProperties supervisor, DevUserProperties technician) {
}

record DevUserProperties(String name, String email, String password) {
}
