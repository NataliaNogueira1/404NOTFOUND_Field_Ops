package com.fieldops.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.inspection.service.InspectionTemplateVersionService;
import com.fieldops.inspection.service.TemplateItemService;
import com.fieldops.inspection.service.TemplateSectionService;
import com.fieldops.client.service.ClientService;
import com.fieldops.equipment.service.EquipmentService;
import com.fieldops.site.service.InspectionSiteService;
import com.fieldops.audit.service.InspectionAnswerHistoryService;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * End-to-end integration test for {@link DemoSeedRunner} (#331): runs the full seed against an
 * in-memory H2 database and asserts the realistic dataset volume and distribution (9 users, 3
 * clients, 5 equipment, 5 published models, ≥2 inspections per lifecycle status spread across
 * models/clients/technicians) plus idempotency on re-run.
 *
 * <p>{@code @Transactional} rolls back every seed write after each test method, so the committed
 * dataset never leaks into other {@code @SpringBootTest} classes that share the same cached
 * context and H2 database.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DemoSeedRunnerIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EquipmentRepository equipmentRepository;
    @Autowired private ClientService clientService;
    @Autowired private InspectionSiteService siteService;
    @Autowired private EquipmentService equipmentService;
    @Autowired private InspectionTemplateService templateService;
    @Autowired private TemplateSectionService sectionService;
    @Autowired private TemplateItemService itemService;
    @Autowired private InspectionTemplateVersionService versionService;
    @Autowired private InspectionService inspectionService;
    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private InspectionItemSnapshotRepository snapshotRepository;
    @Autowired private InspectionAnswerHistoryService answerHistoryService;
    @Autowired private InspectionTemplateRepository templateRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private DemoSeedRunner runner;

    @BeforeEach
    void setUp() {
        // The seed runner is @Profile({"dev","demo"}) so it is NOT a bean under "test".
        // Construct it manually with the autowired dependencies and the seed enabled.
        runner = new DemoSeedRunner(new DemoSeedProperties(true), userRepository, clientRepository,
                equipmentRepository, clientService, siteService, equipmentService, templateService,
                sectionService, itemService, versionService, inspectionService, inspectionRepository,
                snapshotRepository, answerHistoryService, passwordEncoder);

        // The 3 base dev users normally come from DevUsersBootstrapRunner (@Profile dev/demo),
        // which does not run under "test". Create them here so the seed's findByEmail lookups succeed.
        createBaseDevUser("Admin Dev", "admin@fieldops.local", Role.ADMINISTRATOR);
        createBaseDevUser("Supervisor Dev", "supervisor@fieldops.local", Role.SUPERVISOR);
        createBaseDevUser("Tecnico Dev", "technician@fieldops.local", Role.TECHNICIAN);
    }

    @Test
    void seedCreatesRealisticVolumeDistributedAcrossModelsClientsAndTechnicians() {
        runner.run(new EmptyApplicationArguments());

        // ── 9 users: 2 admin, 3 supervisors, 4 technicians ──
        List<User> allUsers = userRepository.findAll();
        assertThat(allUsers).hasSize(9);
        Map<Role, Long> byRole = allUsers.stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        assertThat(byRole.get(Role.ADMINISTRATOR)).isEqualTo(2L);
        assertThat(byRole.get(Role.SUPERVISOR)).isEqualTo(3L);
        assertThat(byRole.get(Role.TECHNICIAN)).isEqualTo(4L);

        // ── 3 clients ──
        assertThat(clientRepository.count()).isEqualTo(3L);

        // ── 5 equipment ──
        assertThat(equipmentRepository.count()).isEqualTo(5L);

        // ── 5 published models ──
        long publishedTemplates = templateRepository.findAll().stream()
                .filter(t -> t.getStatus() == InspectionTemplateStatus.ACTIVE)
                .count();
        assertThat(publishedTemplates).isEqualTo(5L);

        // ── 14 inspections: ≥2 per lifecycle status ──
        List<Inspection> allInspections = inspectionRepository.findAll();
        Map<InspectionStatus, Long> byStatus = allInspections.stream()
                .collect(Collectors.groupingBy(Inspection::getStatus, Collectors.counting()));
        // Every lifecycle status present with at least 2 inspections.
        for (InspectionStatus status : Arrays.asList(
                InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS, InspectionStatus.SUBMITTED,
                InspectionStatus.UNDER_REVIEW, InspectionStatus.APPROVED,
                InspectionStatus.REJECTED, InspectionStatus.CANCELED)) {
            assertThat(byStatus.getOrDefault(status, 0L))
                    .as("status %s should have >= 2 inspections", status)
                    .isGreaterThanOrEqualTo(2L);
        }
        assertThat(allInspections).hasSize(14);

        // ── Distribution: not all on the same technician / client ── (#331)
        assertThat(allInspections.stream().map(i -> i.getTechnician().getId()).collect(Collectors.toSet()))
                .hasSizeGreaterThan(1);
        assertThat(allInspections.stream().map(Inspection::getClientName).collect(Collectors.toSet()))
                .hasSize(3);
        assertThat(allInspections.stream().map(i -> i.getTemplate().getId()).collect(Collectors.toSet()))
                .hasSize(5);

        // ── Terminal states carry their audit metadata (real domain flows) ──
        List<Inspection> canceled = allInspections.stream()
                .filter(i -> i.getStatus() == InspectionStatus.CANCELED).toList();
        assertThat(canceled).allSatisfy(i -> {
            assertThat(i.getCanceledReason()).isNotBlank();
            assertThat(i.getCanceledBy()).isNotNull();
            assertThat(i.getCanceledAt()).isNotNull();
        });
        List<Inspection> approved = allInspections.stream()
                .filter(i -> i.getStatus() == InspectionStatus.APPROVED).toList();
        assertThat(approved).allSatisfy(i -> {
            assertThat(i.getReviewedBy()).isNotNull();
            assertThat(i.getReviewedAt()).isNotNull();
        });
        List<Inspection> rejected = allInspections.stream()
                .filter(i -> i.getStatus() == InspectionStatus.REJECTED).toList();
        assertThat(rejected).allSatisfy(i -> {
            assertThat(i.getRejectionReason()).isNotBlank();
            assertThat(i.getReviewedBy()).isNotNull();
            assertThat(i.getReviewedAt()).isNotNull();
        });
    }

    @Test
    void isIdempotentOnReRun() {
        runner.run(new EmptyApplicationArguments());
        long usersAfterFirst = userRepository.count();
        long clientsAfterFirst = clientRepository.count();
        long inspectionsAfterFirst = inspectionRepository.count();

        // Re-run: the first client's document already exists → seed must skip entirely.
        runner.run(new EmptyApplicationArguments());

        assertThat(userRepository.count()).isEqualTo(usersAfterFirst);
        assertThat(clientRepository.count()).isEqualTo(clientsAfterFirst);
        assertThat(inspectionRepository.count()).isEqualTo(inspectionsAfterFirst);
    }

    private void createBaseDevUser(String name, String email, Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setPassword(passwordEncoder.encode("fieldops-dev"));
        userRepository.save(user);
    }

    /** Minimal no-op ApplicationArguments for the runner. */
    private static class EmptyApplicationArguments implements org.springframework.boot.ApplicationArguments {
        @Override public String[] getSourceArgs() { return new String[0]; }
        @Override public java.util.Set<String> getOptionNames() { return java.util.Collections.emptySet(); }
        @Override public boolean containsOption(String name) { return false; }
        @Override public java.util.List<String> getOptionValues(String name) { return java.util.List.of(); }
        @Override public java.util.List<String> getNonOptionArgs() { return java.util.List.of(); }
    }
}
