package com.fieldops.config;

import com.fieldops.client.dto.ClientRequest;
import com.fieldops.client.dto.ClientResponse;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.client.service.ClientService;
import com.fieldops.equipment.dto.EquipmentRequest;
import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.equipment.service.EquipmentService;
import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionTemplateRequest;
import com.fieldops.inspection.dto.InspectionTemplateResponse;
import com.fieldops.inspection.dto.InspectionTemplateVersionResponse;
import com.fieldops.inspection.dto.TemplateItemRequest;
import com.fieldops.inspection.dto.TemplateSectionRequest;
import com.fieldops.inspection.dto.TemplateSectionResponse;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.inspection.service.InspectionTemplateVersionService;
import com.fieldops.inspection.service.TemplateItemService;
import com.fieldops.inspection.service.TemplateSectionService;
import com.fieldops.site.dto.CreateSiteRequest;
import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.service.InspectionSiteService;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Creates a coherent, reproducible demonstration dataset (PBI-066 / #86): a client, a site,
 * an equipment (with unique QR code), a published inspection template and one inspection
 * assigned to the demo technician. It reuses the dev users created by
 * {@link DevUsersBootstrapRunner} (hence {@code @Order} after it) and the domain services, so
 * every business rule is honoured.
 *
 * Idempotent: guarded by the client's document, so restarting the app does not duplicate data.
 * Active only under the {@code dev} profile and when {@code fieldops.bootstrap.demo-seed.enabled}.
 */
@Component
@Profile({"dev", "demo"})
@Order(100) // after DevUsersBootstrapRunner so the demo users already exist
public class DemoSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSeedRunner.class);

    // Natural idempotency keys and coherent values (compressor example).
    private static final String CLIENT_DOCUMENT = "12.345.678/0001-90";
    private static final String EQUIPMENT_QR = "COMP-004";
    private static final String SUPERVISOR_EMAIL = "supervisor@fieldops.local";
    private static final String TECHNICIAN_EMAIL = "technician@fieldops.local";

    private final DemoSeedProperties properties;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final EquipmentRepository equipmentRepository;
    private final ClientService clientService;
    private final InspectionSiteService siteService;
    private final EquipmentService equipmentService;
    private final InspectionTemplateService templateService;
    private final TemplateSectionService sectionService;
    private final TemplateItemService itemService;
    private final InspectionTemplateVersionService versionService;
    private final InspectionService inspectionService;

    public DemoSeedRunner(DemoSeedProperties properties, UserRepository userRepository,
            ClientRepository clientRepository, EquipmentRepository equipmentRepository,
            ClientService clientService, InspectionSiteService siteService,
            EquipmentService equipmentService, InspectionTemplateService templateService,
            TemplateSectionService sectionService, TemplateItemService itemService,
            InspectionTemplateVersionService versionService, InspectionService inspectionService) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.equipmentRepository = equipmentRepository;
        this.clientService = clientService;
        this.siteService = siteService;
        this.equipmentService = equipmentService;
        this.templateService = templateService;
        this.sectionService = sectionService;
        this.itemService = itemService;
        this.versionService = versionService;
        this.inspectionService = inspectionService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        // Idempotency: the client's document is a stable natural key. If it exists, assume seeded.
        if (clientRepository.existsByDocument(CLIENT_DOCUMENT)) {
            log.info("Demo seed already present (client document {}); skipping.", CLIENT_DOCUMENT);
            return;
        }

        User supervisor = userRepository.findByEmail(SUPERVISOR_EMAIL).orElse(null);
        User technician = userRepository.findByEmail(TECHNICIAN_EMAIL).orElse(null);
        if (supervisor == null || technician == null) {
            log.warn("Demo seed skipped: expected dev users ({}, {}) not found. "
                    + "Ensure DevUsersBootstrapRunner is enabled.", SUPERVISOR_EMAIL, TECHNICIAN_EMAIL);
            return;
        }

        ClientResponse client = clientService.create(new ClientRequest(
                "Industria Modelo Ltda.", "Industria Modelo", CLIENT_DOCUMENT,
                "contato@industriamodelo.com", "1533334444"));

        SiteResponse site = siteService.create(new CreateSiteRequest(
                client.id(), "Unidade Sorocaba - Galpao de Producao 02", "Galpao principal de producao",
                "Rod. Raposo Tavares km 100", "Sorocaba", "SP", "18000-000",
                null, null, "Marina Supervisora", "1533335555"));

        EquipmentResponse equipment = equipmentService.create(new EquipmentRequest(
                site.id(), "Compressor de Ar XPTO 500", "PAT-500", "SN-XPTO-500",
                "Atlas", "XPTO 500", "Compressor industrial de ar", EQUIPMENT_QR,
                EquipmentStatus.ACTIVE, LocalDate.of(2024, 1, 15)));

        Long templateVersionId = seedPublishedTemplate(supervisor.getId());

        inspectionService.createInspection(new CreateInspectionRequest(
                "Inspecao Preventiva - Compressor de Ar XPTO 500",
                templateVersionId, client.id(), site.id(), equipment.id(), technician.getId(),
                Priority.MEDIUM, LocalDate.now().plusDays(7), null,
                "Verificar condicao da bateria e nivel de oleo com atencao especial."),
                supervisor.getId());

        log.info("Demo seed created: client={}, site={}, equipment={}, templateVersion={}, "
                + "inspection ASSIGNED to technicianId={}.",
                client.id(), site.id(), equipment.id(), templateVersionId, technician.getId());
    }

    /** Builds a small but coherent compressor checklist as a draft and publishes it. */
    private Long seedPublishedTemplate(Long publisherId) {
        InspectionTemplateResponse template = templateService.createDraft(new InspectionTemplateRequest(
                "Inspecao Preventiva de Compressor", "Checklist mensal de manutencao preventiva",
                "Compressores"), publisherId);
        Long templateId = template.id();

        sectionService.create(templateId,
                new TemplateSectionRequest("Condicoes Gerais", "Estado geral do equipamento", 1));
        sectionService.create(templateId,
                new TemplateSectionRequest("Funcionamento", "Parametros de operacao", 2));

        // Re-read the template to obtain the persisted section IDs (the create response may not
        // carry the generated id before the surrounding transaction resolves it).
        List<TemplateSectionResponse> sections = templateService.getById(templateId).sections();
        Long conditionsId = sectionByOrder(sections, 1);
        Long operationId = sectionByOrder(sections, 2);

        itemService.create(templateId, conditionsId, new TemplateItemRequest(
                "Carcaca sem vazamentos ou corrosao?", "Inspecao visual da carcaca",
                ResponseType.CONFORMITY, true, true, true, null, 1));
        itemService.create(templateId, conditionsId, new TemplateItemRequest(
                "Nivel de oleo dentro do especificado?", null,
                ResponseType.BOOLEAN, true, true, false, null, 2));
        itemService.create(templateId, operationId, new TemplateItemRequest(
                "Pressao de trabalho (bar)", "Registrar a pressao medida",
                ResponseType.NUMBER, true, false, false, null, 1));

        InspectionTemplateVersionResponse published = versionService.publish(templateId, publisherId);
        return published.id();
    }

    private Long sectionByOrder(List<TemplateSectionResponse> sections, int order) {
        return sections.stream()
                .filter(section -> section.displayOrder() != null && section.displayOrder() == order)
                .map(TemplateSectionResponse::id)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Demo seed: section with order " + order + " not found"));
    }
}

@ConfigurationProperties(prefix = "fieldops.bootstrap.demo-seed")
record DemoSeedProperties(boolean enabled) {
}
