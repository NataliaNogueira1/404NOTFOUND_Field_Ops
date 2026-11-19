package com.fieldops.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.client.dto.ClientRequest;
import com.fieldops.client.dto.ClientResponse;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.client.service.ClientService;
import com.fieldops.equipment.dto.EquipmentRequest;
import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.equipment.service.EquipmentService;
import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.dto.InspectionTemplateResponse;
import com.fieldops.inspection.dto.InspectionTemplateVersionResponse;
import com.fieldops.inspection.dto.TemplateSectionResponse;
import com.fieldops.audit.service.InspectionAnswerHistoryService;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.inspection.service.InspectionTemplateVersionService;
import com.fieldops.inspection.service.TemplateItemService;
import com.fieldops.inspection.service.TemplateSectionService;
import com.fieldops.site.dto.CreateSiteRequest;
import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.service.InspectionSiteService;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DemoSeedRunnerTest {

    private static final String CLIENT_DOCUMENT_1 = "12.345.678/0001-90";
    private static final int EXPECTED_INSPECTIONS = 14;

    @Mock private UserRepository userRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private EquipmentRepository equipmentRepository;
    @Mock private ClientService clientService;
    @Mock private InspectionSiteService siteService;
    @Mock private EquipmentService equipmentService;
    @Mock private InspectionTemplateService templateService;
    @Mock private TemplateSectionService sectionService;
    @Mock private TemplateItemService itemService;
    @Mock private InspectionTemplateVersionService versionService;
    @Mock private InspectionService inspectionService;
    @Mock private InspectionRepository inspectionRepository;
    @Mock private InspectionItemSnapshotRepository snapshotRepository;
    @Mock private InspectionAnswerHistoryService answerHistoryService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private DemoSeedRunner runner;

    @Test
    void seedsRealisticVolumeDistributedAcrossModelsClientsAndTechnicians() {
        enableSeed();
        when(clientRepository.existsByDocument(CLIENT_DOCUMENT_1)).thenReturn(false);
        stubUsers();
        stubCatalog();
        List<Long> createdIds = stubInspectionCreation();
        // advanceStatus reloads the inspection to set the status directly.
        when(inspectionRepository.findById(anyLong()))
                .thenAnswer(invocation -> Optional.of(new Inspection()));
        // No snapshots seeded here → answer-history seeding is a no-op (returns early).
        when(snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(anyLong()))
                .thenReturn(List.<InspectionItemSnapshot>of());

        runner.run(mock(ApplicationArguments.class));

        // ── Catalog volume (#331): 3 clients, 3 sites, 5 equipment, 5 published models ──
        verify(clientService, times(3)).create(any(ClientRequest.class));
        verify(siteService, times(3)).create(any(CreateSiteRequest.class));
        verify(equipmentService, times(5)).create(any(EquipmentRequest.class));
        verify(templateService, times(5)).createDraft(any(), eq(10L));
        verify(versionService, times(5)).publish(anyLong(), eq(10L));

        // ── Additional demo users: 6 created (idempotent by email) ──
        verify(userRepository, times(6)).save(any(User.class));

        // ── Inspections: 14 created (2 per lifecycle status) ──
        ArgumentCaptor<CreateInspectionRequest> requests = ArgumentCaptor.forClass(CreateInspectionRequest.class);
        verify(inspectionService, times(EXPECTED_INSPECTIONS)).createInspection(requests.capture(), anyLong());

        List<CreateInspectionRequest> captured = requests.getAllValues();
        assertThat(captured).hasSize(EXPECTED_INSPECTIONS);
        assertThat(captured).extracting(CreateInspectionRequest::priority)
                .contains(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL);
        assertThat(captured).allSatisfy(request -> {
            assertThat(request.dueDate()).isNotNull();
        });

        // Distribution: not all inspections share the same technician / client / model (#331).
        assertThat(captured.stream().map(CreateInspectionRequest::technicianId).collect(Collectors.toSet()))
                .hasSizeGreaterThan(1);
        assertThat(captured.stream().map(CreateInspectionRequest::clientId).collect(Collectors.toSet()))
                .hasSize(3);
        assertThat(captured.stream().map(CreateInspectionRequest::templateVersionId).collect(Collectors.toSet()))
                .hasSize(1); // the mock returns a single version id; distribution verified in the IT

        // ── Real domain transitions: 2 cancels, 6 beginReviews, 2 approves, 2 rejects ──
        verify(inspectionService, times(2)).cancel(anyLong(), anyString(), anyLong());
        verify(inspectionService, times(6)).beginReview(anyLong(), anyLong());
        verify(inspectionService, times(2)).approve(anyLong(), anyString(), anyLong());
        verify(inspectionService, times(2)).reject(anyLong(), anyString(), anyLong());
    }

    @Test
    void isIdempotentWhenTheFirstDemoClientAlreadyExists() {
        enableSeed();
        when(clientRepository.existsByDocument(CLIENT_DOCUMENT_1)).thenReturn(true);

        runner.run(mock(ApplicationArguments.class));

        verify(inspectionService, never()).createInspection(any(), anyLong());
        verify(clientService, never()).create(any());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void doesNothingWhenSeedIsDisabled() {
        ReflectionTestUtils.setField(runner, "properties", new DemoSeedProperties(false));

        runner.run(mock(ApplicationArguments.class));

        verify(clientRepository, never()).existsByDocument(anyString());
        verify(inspectionService, never()).createInspection(any(), anyLong());
    }

    private void enableSeed() {
        ReflectionTestUtils.setField(runner, "properties", new DemoSeedProperties(true));
    }

    private void stubUsers() {
        // The 3 base dev users come from DevUsersBootstrapRunner.
        User admin = user(5L, Role.ADMINISTRATOR, "admin@fieldops.local");
        User supervisor = user(10L, Role.SUPERVISOR, "supervisor@fieldops.local");
        User technician = user(20L, Role.TECHNICIAN, "technician@fieldops.local");
        when(userRepository.findByEmail("admin@fieldops.local")).thenReturn(Optional.of(admin));
        when(userRepository.findByEmail("supervisor@fieldops.local")).thenReturn(Optional.of(supervisor));
        when(userRepository.findByEmail("technician@fieldops.local")).thenReturn(Optional.of(technician));
        // The 6 additional demo users don't exist yet → findByEmail returns empty so the seed
        // creates them (save is stubbed to assign an id so getId() works downstream).
        for (String email : new String[]{"admin2@fieldops.local", "supervisor2@fieldops.local",
                "supervisor3@fieldops.local", "technician2@fieldops.local",
                "technician3@fieldops.local", "technician4@fieldops.local"}) {
            when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        }
        AtomicLong userId = new AtomicLong(30L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            ReflectionTestUtils.setField(u, "id", userId.incrementAndGet());
            return u;
        });
        when(passwordEncoder.encode(anyString())).thenReturn("hash-demo");
    }

    private void stubCatalog() {
        // Three clients.
        when(clientService.create(any(ClientRequest.class)))
                .thenReturn(clientResponse(1L))
                .thenReturn(clientResponse(2L))
                .thenReturn(clientResponse(3L));
        // Three sites.
        when(siteService.create(any(CreateSiteRequest.class)))
                .thenReturn(siteResponse(10L, 1L))
                .thenReturn(siteResponse(11L, 2L))
                .thenReturn(siteResponse(12L, 3L));
        // Five equipment.
        when(equipmentService.create(any(EquipmentRequest.class)))
                .thenReturn(equipmentResponse(20L, 10L))
                .thenReturn(equipmentResponse(21L, 11L))
                .thenReturn(equipmentResponse(22L, 11L))
                .thenReturn(equipmentResponse(23L, 12L))
                .thenReturn(equipmentResponse(24L, 12L));
        // Five templates — all share the same mock ids for the unit test.
        when(templateService.createDraft(any(), eq(10L))).thenReturn(templateResponse(30L));
        when(templateService.getById(30L)).thenReturn(templateWithSections(30L));
        when(versionService.publish(30L, 10L)).thenReturn(versionResponse(40L));
    }

    /** Returns increasing inspection IDs, recording every created ID in creation order. */
    private List<Long> stubInspectionCreation() {
        List<Long> createdIds = new java.util.ArrayList<>();
        AtomicLong lastId = new AtomicLong(100L);
        when(inspectionService.createInspection(any(CreateInspectionRequest.class), anyLong()))
                .thenAnswer(invocation -> {
                    long id = lastId.incrementAndGet();
                    createdIds.add(id);
                    return inspectionResponse(id);
                });
        return createdIds;
    }

    private static User user(Long id, Role role, String email) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setRole(role);
        user.setEmail(email);
        return user;
    }

    private static ClientResponse clientResponse(Long id) {
        return new ClientResponse(id, "Cliente Demo " + id, "Razao " + id, "00.000.000/0000-00",
                "contato@demo.com", "1100000000", ClientStatus.ACTIVE, 1, null, null, 0);
    }

    private static SiteResponse siteResponse(Long id, Long clientId) {
        return new SiteResponse(id, clientId, "Cliente Demo " + clientId, "Unidade " + id,
                "Galpao", "Rua Teste", "Cidade", "SP", "00000-000",
                null, null, "Contato", "1100000000", SiteStatus.ACTIVE, null, null, 0);
    }

    private static EquipmentResponse equipmentResponse(Long id, Long siteId) {
        return new EquipmentResponse(id, siteId, "Unidade " + siteId, 1L, "Equipamento " + id,
                "PAT-" + id, "SN-" + id, "Fabricante", "Modelo", "Descricao", "QR-" + id,
                EquipmentStatus.ACTIVE, null, null, null, 0);
    }

    private static InspectionTemplateResponse templateResponse(Long id) {
        return new InspectionTemplateResponse(id, "Modelo Demo", "Checklist", "Categoria",
                InspectionTemplateStatus.DRAFT, 0, 10L, null, null, 0, List.of());
    }

    private static InspectionTemplateResponse templateWithSections(Long id) {
        List<TemplateSectionResponse> sections = List.of(
                new TemplateSectionResponse(11L, "Secao A", "", 1, null, List.of()),
                new TemplateSectionResponse(12L, "Secao B", "", 2, null, List.of()));
        return new InspectionTemplateResponse(id, "Modelo Demo", "Checklist", "Categoria",
                InspectionTemplateStatus.DRAFT, 0, 10L, null, null, 0, sections);
    }

    private static InspectionTemplateVersionResponse versionResponse(Long id) {
        return new InspectionTemplateVersionResponse(id, 1, "Modelo Demo",
                "Checklist", null, 10L);
    }

    private static InspectionResponse inspectionResponse(Long id) {
        return new InspectionResponse(id, "Inspecao demo", InspectionStatus.ASSIGNED,
                null, "Cliente Demo", "Equipamento Demo", "Technician");
    }

    private static <T> T mock(Class<T> type) {
        return org.mockito.Mockito.mock(type);
    }
}
