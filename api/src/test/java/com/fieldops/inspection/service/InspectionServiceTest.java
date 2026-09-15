package com.fieldops.inspection.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateVersion;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateVersionRepository;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.repository.InspectionSiteRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class InspectionServiceTest {

    @Mock
    private InspectionRepository inspectionRepository;

    @Mock
    private InspectionTemplateVersionRepository versionRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private InspectionSiteRepository siteRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.fieldops.audit.service.AuditService auditService;

    @InjectMocks
    private InspectionService inspectionService;

    @Test
    void copiesEveryTemplateItemFieldIntoAnIndependentSnapshotWhenCreatingInspection() {
        User supervisor = user("Supervisor", Role.SUPERVISOR);
        User technician = user("Technician", Role.TECHNICIAN);
        InspectionTemplateVersion version = publishedVersion(supervisor);
        Client client = new Client();
        client.setName("Acme");
        InspectionSite site = new InspectionSite();
        site.setName("Plant 1");
        site.setClient(client);
        Equipment equipment = new Equipment();
        equipment.setName("Compressor A");
        equipment.setSite(site);

        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));
        when(clientRepository.findById(11L)).thenReturn(Optional.of(client));
        when(siteRepository.findById(12L)).thenReturn(Optional.of(site));
        when(equipmentRepository.findById(13L)).thenReturn(Optional.of(equipment));
        when(userRepository.findById(14L)).thenReturn(Optional.of(technician));
        when(userRepository.findById(15L)).thenReturn(Optional.of(supervisor));
        when(inspectionRepository.save(any(Inspection.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateInspectionRequest request = new CreateInspectionRequest(
                "Preventive inspection", 7L, 11L, 12L, 13L, 14L, Priority.HIGH,
                LocalDate.of(2026, 9, 12), null, "Lock out the equipment");

        InspectionResponse response = inspectionService.createInspection(request, 15L);

        ArgumentCaptor<Inspection> inspectionCaptor = ArgumentCaptor.forClass(Inspection.class);
        org.mockito.Mockito.verify(inspectionRepository).save(inspectionCaptor.capture());
        Inspection inspection = inspectionCaptor.getValue();
        assertThat(response.equipmentName()).isEqualTo("Compressor A");
        assertThat(inspection.getEquipmentName()).isEqualTo("Compressor A");
        assertThat(inspection.getTemplateVersion()).isSameAs(version);
        assertThat(inspection.getItemSnapshots()).singleElement().satisfies(snapshot -> {
            assertThat(snapshot.getSourceTemplateItemId()).isEqualTo(44L);
            assertThat(snapshot.getSectionTitle()).isEqualTo("Electrical safety");
            assertThat(snapshot.getSectionOrder()).isEqualTo(2);
            assertThat(snapshot.getItemCode()).isEqualTo("ELEC-001");
            assertThat(snapshot.getItemTitle()).isEqualTo("Are the cables intact?");
            assertThat(snapshot.getItemDescription()).isEqualTo("Inspect the entire cable length");
            assertThat(snapshot.getResponseType()).isEqualTo(ResponseType.SINGLE_CHOICE);
            assertThat(snapshot.isRequired()).isTrue();
            assertThat(snapshot.getRulesJson()).isEqualTo(
                    "{\"required\":true,\"observationRequiredOnFailure\":true,"
                            + "\"evidenceRequiredOnFailure\":true}");
            assertThat(snapshot.getOptionsJson()).isEqualTo("[\"Good\",\"Damaged\"]");
            assertThat(snapshot.getItemOrder()).isEqualTo(3);
        });

        TemplateItem source = version.getTemplate().getSections().get(0).getItems().get(0);
        source.setQuestion("Changed after scheduling");
        InspectionItemSnapshot snapshot = inspection.getItemSnapshots().get(0);
        assertThat(snapshot.getItemTitle()).isEqualTo("Are the cables intact?");
    }

    @Test
    void createsInspectionWithoutEquipmentWhenEquipmentIdIsMissing() {
        User supervisor = user("Supervisor", Role.SUPERVISOR);
        User technician = user("Technician", Role.TECHNICIAN);
        InspectionTemplateVersion version = publishedVersion(supervisor);
        Client client = new Client();
        client.setName("Acme");
        InspectionSite site = new InspectionSite();
        site.setName("Plant 1");
        site.setClient(client);

        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));
        when(clientRepository.findById(11L)).thenReturn(Optional.of(client));
        when(siteRepository.findById(12L)).thenReturn(Optional.of(site));
        when(userRepository.findById(14L)).thenReturn(Optional.of(technician));
        when(userRepository.findById(15L)).thenReturn(Optional.of(supervisor));
        when(inspectionRepository.save(any(Inspection.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InspectionResponse response = inspectionService.createInspection(requestWithoutEquipment(), 15L);

        ArgumentCaptor<Inspection> inspectionCaptor = ArgumentCaptor.forClass(Inspection.class);
        org.mockito.Mockito.verify(inspectionRepository).save(inspectionCaptor.capture());
        Inspection inspection = inspectionCaptor.getValue();
        assertThat(inspection.getEquipmentName()).isNull();
        assertThat(response.equipmentName()).isNull();
        org.mockito.Mockito.verify(equipmentRepository, org.mockito.Mockito.never()).findById(any());
    }

    @Test
    void rejectsEquipmentThatDoesNotBelongToInspectionSite() {
        User supervisor = user("Supervisor", Role.SUPERVISOR);
        User technician = user("Technician", Role.TECHNICIAN);
        InspectionTemplateVersion version = publishedVersion(supervisor);
        Client client = new Client();
        client.setName("Acme");
        InspectionSite selectedSite = new InspectionSite();
        ReflectionTestUtils.setField(selectedSite, "id", 12L);
        selectedSite.setName("Plant 1");
        selectedSite.setClient(client);
        InspectionSite equipmentSite = new InspectionSite();
        ReflectionTestUtils.setField(equipmentSite, "id", 99L);
        equipmentSite.setName("Plant 2");
        equipmentSite.setClient(client);
        Equipment equipment = new Equipment();
        equipment.setName("Compressor A");
        equipment.setSite(equipmentSite);

        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));
        when(clientRepository.findById(11L)).thenReturn(Optional.of(client));
        when(siteRepository.findById(12L)).thenReturn(Optional.of(selectedSite));
        when(equipmentRepository.findById(13L)).thenReturn(Optional.of(equipment));
        when(userRepository.findById(14L)).thenReturn(Optional.of(technician));
        when(userRepository.findById(15L)).thenReturn(Optional.of(supervisor));

        assertThatThrownBy(() -> inspectionService.createInspection(request(), 15L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Equipment does not belong to inspection site");

        org.mockito.Mockito.verify(inspectionRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void rejectsInactiveTechnicianWithSpecificBusinessCode() {
        User supervisor = user("Supervisor", Role.SUPERVISOR);
        User technician = user("Technician", Role.TECHNICIAN);
        technician.setStatus(UserStatus.INACTIVE);
        InspectionTemplateVersion version = publishedVersion(supervisor);
        Client client = new Client();
        client.setName("Acme");
        InspectionSite site = new InspectionSite();
        site.setName("Plant 1");
        site.setClient(client);
        Equipment equipment = new Equipment();
        equipment.setName("Compressor A");
        equipment.setSite(site);

        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));
        when(clientRepository.findById(11L)).thenReturn(Optional.of(client));
        when(siteRepository.findById(12L)).thenReturn(Optional.of(site));
        when(equipmentRepository.findById(13L)).thenReturn(Optional.of(equipment));
        when(userRepository.findById(14L)).thenReturn(Optional.of(technician));
        when(userRepository.findById(15L)).thenReturn(Optional.of(supervisor));

        CreateInspectionRequest request = new CreateInspectionRequest(
                "Preventive inspection", 7L, 11L, 12L, 13L, 14L, Priority.HIGH,
                LocalDate.of(2026, 9, 12), null, "Lock out the equipment");

        assertThatThrownBy(() -> inspectionService.createInspection(request, 15L))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getCode())
                .isEqualTo("TECHNICIAN_NOT_ACTIVE");

        org.mockito.Mockito.verify(inspectionRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void rejectsUnpublishedTemplateVersion() {
        InspectionTemplateVersion version = mock(InspectionTemplateVersion.class);
        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));

        assertThatThrownBy(() -> inspectionService.createInspection(request(), 15L))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getCode())
                .isEqualTo("TEMPLATE_VERSION_NOT_PUBLISHED");

        org.mockito.Mockito.verify(inspectionRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void rejectsInactiveClientForNewInspection() {
        User supervisor = user("Supervisor", Role.SUPERVISOR);
        InspectionTemplateVersion version = publishedVersion(supervisor);
        Client client = new Client();
        client.setName("Inactive client");
        client.setStatus(ClientStatus.INACTIVE);
        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));
        when(clientRepository.findById(11L)).thenReturn(Optional.of(client));

        assertThatThrownBy(() -> inspectionService.createInspection(request(), 15L))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getCode())
                .isEqualTo("CLIENT_NOT_ACTIVE");

        org.mockito.Mockito.verify(inspectionRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void rejectsInactiveEquipmentForNewInspection() {
        User supervisor = user("Supervisor", Role.SUPERVISOR);
        InspectionTemplateVersion version = publishedVersion(supervisor);
        Client client = new Client();
        client.setName("Acme");
        InspectionSite site = new InspectionSite();
        site.setName("Plant 1");
        site.setClient(client);
        Equipment equipment = new Equipment();
        equipment.setName("Inactive compressor");
        equipment.setSite(site);
        equipment.setStatus(EquipmentStatus.INACTIVE);
        when(versionRepository.findById(7L)).thenReturn(Optional.of(version));
        when(clientRepository.findById(11L)).thenReturn(Optional.of(client));
        when(siteRepository.findById(12L)).thenReturn(Optional.of(site));
        when(equipmentRepository.findById(13L)).thenReturn(Optional.of(equipment));

        assertThatThrownBy(() -> inspectionService.createInspection(request(), 15L))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getCode())
                .isEqualTo("EQUIPMENT_NOT_ACTIVE");

        org.mockito.Mockito.verify(inspectionRepository, org.mockito.Mockito.never()).save(any());
    }

    private CreateInspectionRequest request() {
        return new CreateInspectionRequest(
                "Preventive inspection", 7L, 11L, 12L, 13L, 14L, Priority.HIGH,
                LocalDate.of(2026, 9, 14), null, "Lock out the equipment");
    }

    private CreateInspectionRequest requestWithoutEquipment() {
        return new CreateInspectionRequest(
                "Preventive inspection", 7L, 11L, 12L, null, 14L, Priority.HIGH,
                LocalDate.of(2026, 9, 14), null, "Lock out the equipment");
    }

    private InspectionTemplateVersion publishedVersion(User supervisor) {
        TemplateItem item = new TemplateItem();
        ReflectionTestUtils.setField(item, "id", 44L);
        item.setCode("ELEC-001");
        item.setQuestion("Are the cables intact?");
        item.setDescription("Inspect the entire cable length");
        item.setResponseType(ResponseType.SINGLE_CHOICE);
        item.setRequired(true);
        item.setObservationRequiredOnFailure(true);
        item.setEvidenceRequiredOnFailure(true);
        item.setOptionsJson("[\"Good\",\"Damaged\"]");
        item.setDisplayOrder(3);

        TemplateSection section = new TemplateSection();
        section.setTitle("Electrical safety");
        section.setDisplayOrder(2);
        item.setSection(section);
        section.getItems().add(item);

        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Compressor checklist");
        template.setCategory("MAINTENANCE");
        template.setCreatedBy(supervisor);
        template.setPublished(true);
        section.setTemplate(template);
        template.getSections().add(section);
        return InspectionTemplateVersion.publish(template, 1, supervisor, Instant.parse("2026-09-09T12:00:00Z"));
    }

    private User user(String name, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@fieldops.com");
        user.setPassword("hash");
        user.setRole(role);
        return user;
    }
}
