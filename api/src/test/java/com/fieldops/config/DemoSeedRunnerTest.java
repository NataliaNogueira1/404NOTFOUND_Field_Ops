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
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DemoSeedRunnerTest {

    private static final String CLIENT_DOCUMENT = "12.345.678/0001-90";
    private static final int EXPECTED_INSPECTIONS = 6;

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
    @Mock private InspectionItemSnapshotRepository snapshotRepository;
    @Mock private InspectionAnswerHistoryService answerHistoryService;

    @InjectMocks private DemoSeedRunner runner;

    @Test
    void seedsSixInspectionsWithVariedPrioritiesAndCancelsOne() {
        enableSeed();
        when(clientRepository.existsByDocument(CLIENT_DOCUMENT)).thenReturn(false);
        stubUsers();
        stubCatalog();
        AtomicLong sequence = stubInspectionCreation();
        // No snapshots seeded here → answer-history seeding is a no-op (returns early).
        when(snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(anyLong()))
                .thenReturn(List.<InspectionItemSnapshot>of());

        runner.run(mock(ApplicationArguments.class));

        ArgumentCaptor<CreateInspectionRequest> requests = ArgumentCaptor.forClass(CreateInspectionRequest.class);
        verify(inspectionService, times(EXPECTED_INSPECTIONS)).createInspection(requests.capture(), eq(10L));

        List<CreateInspectionRequest> captured = requests.getAllValues();
        assertThat(captured).hasSize(EXPECTED_INSPECTIONS);
        assertThat(captured).extracting(CreateInspectionRequest::priority)
                .contains(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL);
        assertThat(captured).allSatisfy(request -> {
            assertThat(request.technicianId()).isEqualTo(20L);
            assertThat(request.dueDate()).isNotNull();
        });

        // The last inspection is canceled through the real cancel flow to show a terminal state.
        verify(inspectionService).cancel(eq(sequence.get()), anyString(), eq(10L));
    }

    @Test
    void isIdempotentWhenTheDemoClientAlreadyExists() {
        enableSeed();
        when(clientRepository.existsByDocument(CLIENT_DOCUMENT)).thenReturn(true);

        runner.run(mock(ApplicationArguments.class));

        verify(inspectionService, never()).createInspection(any(), anyLong());
        verify(clientService, never()).create(any());
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
        User supervisor = user(10L, Role.SUPERVISOR, "supervisor@fieldops.local");
        User technician = user(20L, Role.TECHNICIAN, "technician@fieldops.local");
        when(userRepository.findByEmail("supervisor@fieldops.local")).thenReturn(Optional.of(supervisor));
        when(userRepository.findByEmail("technician@fieldops.local")).thenReturn(Optional.of(technician));
    }

    private void stubCatalog() {
        when(clientService.create(any(ClientRequest.class))).thenReturn(clientResponse(1L));
        when(siteService.create(any(CreateSiteRequest.class))).thenReturn(siteResponse(2L, 1L));
        when(equipmentService.create(any(EquipmentRequest.class))).thenReturn(equipmentResponse(3L, 2L));
        when(templateService.createDraft(any(), eq(10L))).thenReturn(templateResponse(4L));
        when(templateService.getById(4L)).thenReturn(templateWithSections(4L));
        when(versionService.publish(4L, 10L)).thenReturn(versionResponse(5L));
    }

    /** Returns increasing inspection IDs and records the last one (the canceled candidate). */
    private AtomicLong stubInspectionCreation() {
        AtomicLong lastId = new AtomicLong();
        when(inspectionService.createInspection(any(CreateInspectionRequest.class), eq(10L)))
                .thenAnswer(invocation -> {
                    long id = lastId.incrementAndGet() + 100L;
                    lastId.set(id);
                    return inspectionResponse(id);
                });
        return lastId;
    }

    private static User user(Long id, Role role, String email) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setRole(role);
        user.setEmail(email);
        return user;
    }

    private static ClientResponse clientResponse(Long id) {
        return new ClientResponse(id, "Industria Modelo Ltda.", "Industria Modelo", CLIENT_DOCUMENT,
                "contato@industriamodelo.com", "1533334444", ClientStatus.ACTIVE, 1, null, null, 0);
    }

    private static SiteResponse siteResponse(Long id, Long clientId) {
        return new SiteResponse(id, clientId, "Industria Modelo Ltda.", "Unidade Sorocaba",
                "Galpao", "Rod. Raposo Tavares", "Sorocaba", "SP", "18000-000",
                null, null, "Marina", "1533335555", SiteStatus.ACTIVE, null, null, 0);
    }

    private static EquipmentResponse equipmentResponse(Long id, Long siteId) {
        return new EquipmentResponse(id, siteId, "Unidade Sorocaba", 1L, "Compressor de Ar XPTO 500",
                "PAT-500", "SN-XPTO-500", "Atlas", "XPTO 500", "Compressor", "COMP-004",
                EquipmentStatus.ACTIVE, null, null, null, 0);
    }

    private static InspectionTemplateResponse templateResponse(Long id) {
        return new InspectionTemplateResponse(id, "Inspecao Preventiva de Compressor",
                "Checklist mensal", "Compressores", InspectionTemplateStatus.DRAFT, 0, 10L,
                null, null, 0, List.of());
    }

    private static InspectionTemplateResponse templateWithSections(Long id) {
        List<TemplateSectionResponse> sections = List.of(
                new TemplateSectionResponse(11L, "Condicoes Gerais", "", 1, null, List.of()),
                new TemplateSectionResponse(12L, "Funcionamento", "", 2, null, List.of()));
        return new InspectionTemplateResponse(id, "Inspecao Preventiva de Compressor",
                "Checklist mensal", "Compressores", InspectionTemplateStatus.DRAFT, 0, 10L,
                null, null, 0, sections);
    }

    private static InspectionTemplateVersionResponse versionResponse(Long id) {
        return new InspectionTemplateVersionResponse(id, 1, "Inspecao Preventiva de Compressor",
                "Checklist mensal", null, 10L);
    }

    private static InspectionResponse inspectionResponse(Long id) {
        return new InspectionResponse(id, "Inspecao demo", InspectionStatus.ASSIGNED,
                null, "Industria Modelo Ltda.", "Compressor de Ar XPTO 500", "Technician");
    }

    private static <T> T mock(Class<T> type) {
        return org.mockito.Mockito.mock(type);
    }
}
