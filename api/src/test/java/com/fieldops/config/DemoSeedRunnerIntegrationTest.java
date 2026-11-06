package com.fieldops.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fieldops.audit.service.InspectionAnswerHistoryService;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.client.service.ClientService;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.equipment.service.EquipmentService;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.inspection.service.InspectionTemplateVersionService;
import com.fieldops.inspection.service.TemplateItemService;
import com.fieldops.inspection.service.TemplateSectionService;
import com.fieldops.site.repository.InspectionSiteRepository;
import com.fieldops.site.service.InspectionSiteService;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import java.util.EnumMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

/**
 * End-to-end verification of the demo seed (#258): boots the real services against the in-memory
 * database, runs {@link DemoSeedRunner} and asserts the persisted inspections contain at least two
 * of every lifecycle state, reached through the genuine domain flows. Also verifies idempotency.
 *
 * <p>The runner is constructed from autowired beans (rather than relying on the {@code dev}/{@code
 * demo} profile component scan) and its properties are enabled directly, so no other bootstrap
 * runner interferes with the assertions.
 */
@SpringBootTest
@ActiveProfiles("test")
class DemoSeedRunnerIntegrationTest {

    private static final String SUPERVISOR_EMAIL = "supervisor@fieldops.local";
    private static final String TECHNICIAN_EMAIL = "technician@fieldops.local";

    @Autowired private UserRepository userRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EquipmentRepository equipmentRepository;
    @Autowired private ClientService clientService;
    @Autowired private InspectionSiteService siteService;
    @Autowired private InspectionSiteRepository siteRepository;
    @Autowired private EquipmentService equipmentService;
    @Autowired private InspectionTemplateService templateService;
    @Autowired private TemplateSectionService sectionService;
    @Autowired private TemplateItemService itemService;
    @Autowired private InspectionTemplateVersionService versionService;
    @Autowired private InspectionService inspectionService;
    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private InspectionItemSnapshotRepository snapshotRepository;
    @Autowired private InspectionAnswerHistoryService answerHistoryService;
    @Autowired private PasswordEncoder passwordEncoder;

    private DemoSeedRunner runner;

    @BeforeEach
    void setUp() {
        cleanInspectionData();
        persistDemoUsers();
        runner = new DemoSeedRunner(new DemoSeedProperties(true), userRepository, clientRepository,
                equipmentRepository, clientService, siteService, equipmentService, templateService,
                sectionService, itemService, versionService, inspectionService, inspectionRepository,
                snapshotRepository, answerHistoryService);
    }

    @AfterEach
    void tearDown() {
        cleanInspectionData();
    }

    @Test
    void seedsAtLeastTwoInspectionsInEveryLifecycleState() {
        runner.run(mock(ApplicationArguments.class));

        Map<InspectionStatus, Long> counts = countByStatus();

        for (InspectionStatus status : lifecycleStates()) {
            assertThat(counts.getOrDefault(status, 0L))
                    .as("inspections in state %s", status)
                    .isGreaterThanOrEqualTo(2L);
        }

        // The seed must not create DRAFT inspections (not part of the demonstration set).
        assertThat(counts.getOrDefault(InspectionStatus.DRAFT, 0L)).isZero();

        // The terminal/review states carry the data produced by the real domain transitions.
        assertThat(inspectionRepository.findAll())
                .filteredOn(inspection -> inspection.getStatus() == InspectionStatus.CANCELED)
                .allSatisfy(inspection -> {
                    assertThat(inspection.getCanceledAt()).isNotNull();
                    assertThat(inspection.getCanceledBy()).isNotNull();
                    assertThat(inspection.getCanceledReason()).isNotBlank();
                });
        assertThat(inspectionRepository.findAll())
                .filteredOn(inspection -> inspection.getStatus() == InspectionStatus.REJECTED)
                .allSatisfy(inspection -> {
                    assertThat(inspection.getReviewedBy()).isNotNull();
                    assertThat(inspection.getRejectionReason()).isNotBlank();
                });
        assertThat(inspectionRepository.findAll())
                .filteredOn(inspection -> inspection.getStatus() == InspectionStatus.APPROVED)
                .allSatisfy(inspection -> assertThat(inspection.getReviewedBy()).isNotNull());
    }

    @Test
    void isIdempotentAcrossRepeatedRuns() {
        runner.run(mock(ApplicationArguments.class));
        long afterFirstRun = inspectionRepository.count();

        // A second run must detect the existing demo client and create nothing new.
        runner.run(mock(ApplicationArguments.class));

        assertThat(inspectionRepository.count()).isEqualTo(afterFirstRun);
    }

    private Map<InspectionStatus, Long> countByStatus() {
        Map<InspectionStatus, Long> counts = new EnumMap<>(InspectionStatus.class);
        for (Inspection inspection : inspectionRepository.findAll()) {
            counts.merge(inspection.getStatus(), 1L, Long::sum);
        }
        return counts;
    }

    private static InspectionStatus[] lifecycleStates() {
        return new InspectionStatus[] {
                InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS, InspectionStatus.SUBMITTED,
                InspectionStatus.UNDER_REVIEW, InspectionStatus.APPROVED, InspectionStatus.REJECTED,
                InspectionStatus.CANCELED };
    }

    private void persistDemoUsers() {
        persistUser("Supervisor Demo", SUPERVISOR_EMAIL, Role.SUPERVISOR);
        persistUser("Technician Demo", TECHNICIAN_EMAIL, Role.TECHNICIAN);
    }

    private void persistUser(String name, String email, Role role) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setPassword(passwordEncoder.encode("pass123"));
        userRepository.save(user);
    }

    // Delete in FK dependency order: inspections (snapshots cascade) → equipment → sites → clients.
    private void cleanInspectionData() {
        inspectionRepository.deleteAll();
        equipmentRepository.deleteAll();
        siteRepository.deleteAll();
        clientRepository.deleteAll();
    }
}
