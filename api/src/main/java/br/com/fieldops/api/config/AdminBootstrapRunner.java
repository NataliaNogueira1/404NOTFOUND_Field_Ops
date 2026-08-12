package br.com.fieldops.api.config;

import br.com.fieldops.api.usuario.domain.Perfil;
import br.com.fieldops.api.usuario.domain.Usuario;
import br.com.fieldops.api.usuario.repository.UsuarioRepository;
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
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapRunner(BootstrapProperties properties, UsuarioRepository usuarioRepository,
                                PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled() || usuarioRepository.existsByEmail(properties.adminEmail())) {
            return;
        }
        Usuario admin = new Usuario();
        admin.setNome("Administrator");
        admin.setEmail(properties.adminEmail());
        admin.setSenha(passwordEncoder.encode(properties.adminPassword()));
        admin.setPerfil(Perfil.ADMINISTRATOR);
        usuarioRepository.save(admin);
        log.info("Bootstrapped administrator account for {}", properties.adminEmail());
    }
}
