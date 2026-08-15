package com.fieldops.config;

import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Idempotently creates an administrator account on startup when
 * {@code BOOTSTRAP_ADMIN_EMAIL} and {@code BOOTSTRAP_ADMIN_PASSWORD} are provided.
 * Skips silently if disabled or if the account already exists.
 */
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final BootstrapProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapRunner(BootstrapProperties properties, UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled() || userRepository.existsByEmail(properties.adminEmail())) {
            return;
        }
        User admin = new User();
        admin.setName("Administrator");
        admin.setEmail(properties.adminEmail());
        admin.setPassword(passwordEncoder.encode(properties.adminPassword()));
        admin.setRole(Role.ADMINISTRATOR);
        userRepository.save(admin);
        log.info("Bootstrapped administrator account for {}", properties.adminEmail());
    }
}
