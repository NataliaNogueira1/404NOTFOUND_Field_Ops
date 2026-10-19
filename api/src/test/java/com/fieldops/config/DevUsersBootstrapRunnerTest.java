package com.fieldops.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class DevUsersBootstrapRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationArguments arguments;

    @Test
    void createsDemoUsersWithConfiguredRolesAndEncodedPasswords() {
        DevUsersBootstrapRunner runner = runner(true);
        when(userRepository.findByEmail("admin@fieldops.local")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("supervisor@fieldops.local")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("technician@fieldops.local")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("fieldops-admin-dev")).thenReturn("hash-admin");
        when(passwordEncoder.encode("fieldops-supervisor-dev")).thenReturn("hash-supervisor");
        when(passwordEncoder.encode("fieldops-technician-dev")).thenReturn("hash-technician");

        runner.run(arguments);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.times(3)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(User::getEmail, User::getRole, User::getStatus, User::getPassword)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(
                                "admin@fieldops.local", Role.ADMINISTRATOR, UserStatus.ACTIVE, "hash-admin"),
                        org.assertj.core.groups.Tuple.tuple(
                                "supervisor@fieldops.local", Role.SUPERVISOR, UserStatus.ACTIVE, "hash-supervisor"),
                        org.assertj.core.groups.Tuple.tuple(
                                "technician@fieldops.local", Role.TECHNICIAN, UserStatus.ACTIVE, "hash-technician"));
    }

    @Test
    void resetsExistingDemoUsersToConfiguredPasswordRoleAndActiveStatus() {
        User supervisor = new User();
        supervisor.setName("Old Supervisor");
        supervisor.setEmail("supervisor@fieldops.local");
        supervisor.setPassword("old-hash");
        supervisor.setRole(Role.TECHNICIAN);
        supervisor.setStatus(UserStatus.BLOCKED);

        DevUsersBootstrapRunner runner = runner(true);
        when(userRepository.findByEmail("admin@fieldops.local")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("supervisor@fieldops.local")).thenReturn(Optional.of(supervisor));
        when(userRepository.findByEmail("technician@fieldops.local")).thenReturn(Optional.empty());
        when(passwordEncoder.matches("fieldops-supervisor-dev", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("fieldops-admin-dev")).thenReturn("hash-admin");
        when(passwordEncoder.encode("fieldops-supervisor-dev")).thenReturn("hash-supervisor");
        when(passwordEncoder.encode("fieldops-technician-dev")).thenReturn("hash-technician");

        runner.run(arguments);

        assertThat(supervisor.getName()).isEqualTo("Supervisor Dev");
        assertThat(supervisor.getRole()).isEqualTo(Role.SUPERVISOR);
        assertThat(supervisor.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(supervisor.getPassword()).isEqualTo("hash-supervisor");
        verify(userRepository).save(supervisor);
    }

    @Test
    void doesNothingWhenDevUsersAreDisabled() {
        DevUsersBootstrapRunner runner = runner(false);

        runner.run(arguments);

        verify(userRepository, never()).save(org.mockito.Mockito.any());
    }

    private DevUsersBootstrapRunner runner(boolean enabled) {
        DevUserProperties admin = new DevUserProperties(
                "Admin Dev", "admin@fieldops.local", "fieldops-admin-dev");
        DevUserProperties supervisor = new DevUserProperties(
                "Supervisor Dev", "supervisor@fieldops.local", "fieldops-supervisor-dev");
        DevUserProperties technician = new DevUserProperties(
                "Tecnico Dev", "technician@fieldops.local", "fieldops-technician-dev");
        return new DevUsersBootstrapRunner(
                new DevUsersProperties(enabled, admin, supervisor, technician),
                userRepository,
                passwordEncoder);
    }
}
