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
import com.fieldops.audit.service.InspectionAnswerHistoryService;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final InspectionAnswerHistoryService answerHistoryService;

    public DemoSeedRunner(DemoSeedProperties properties, UserRepository userRepository,
            ClientRepository clientRepository, EquipmentRepository equipmentRepository,
            ClientService clientService, InspectionSiteService siteService,
            EquipmentService equipmentService, InspectionTemplateService templateService,
            TemplateSectionService sectionService, TemplateItemService itemService,
            InspectionTemplateVersionService versionService, InspectionService inspectionService,
            InspectionItemSnapshotRepository snapshotRepository,
            InspectionAnswerHistoryService answerHistoryService) {
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
        this.snapshotRepository = snapshotRepository;
        this.answerHistoryService = answerHistoryService;
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

        SeededInspections seeded = seedInspections(templateVersionId, client.id(), site.id(),
                equipment.id(), technician.getId(), supervisor.getId());

        // Seed a detailed answer history (PBI-088) on the first inspection so the admin can see a
        // realistic timeline, including an item answered more than once over time.
        seedAnswerHistory(seeded.firstInspectionId(), technician.getId());

        log.info("Demo seed created: client={}, site={}, equipment={}, templateVersion={}, "
                + "{} inspections for technicianId={}.",
                client.id(), site.id(), equipment.id(), templateVersionId, seeded.created(), technician.getId());
    }

    private record SeededInspections(int created, Long firstInspectionId) {
    }

    /**
     * Appends a coherent answer history to the given inspection (PBI-088). The first item is
     * answered three times (Conforming -> Non-conforming -> Conforming) to demonstrate that the
     * history keeps every version chronologically, not just the current value.
     */
    private void seedAnswerHistory(Long inspectionId, Long technicianId) {
        if (inspectionId == null) {
            return;
        }
        List<InspectionItemSnapshot> items = snapshotRepository
                .findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspectionId);
        if (items.isEmpty()) {
            return;
        }
        Instant base = Instant.now().minus(2, ChronoUnit.HOURS);

        InspectionItemSnapshot first = items.get(0);
        // Same item answered three times over ~40 minutes: full change history.
        appendAnswer(inspectionId, technicianId, first, "NON_CONFORMING",
                "Carcaca apresentou leve corrosao na base.", base);
        appendAnswer(inspectionId, technicianId, first, "NON_CONFORMING",
                "Corrosao confirmada apos limpeza; requer tratamento.", base.plus(20, ChronoUnit.MINUTES));
        appendAnswer(inspectionId, technicianId, first, "CONFORMING",
                "Superficie tratada e liberada.", base.plus(40, ChronoUnit.MINUTES));

        // Remaining items answered once each.
        for (int index = 1; index < items.size(); index++) {
            InspectionItemSnapshot item = items.get(index);
            String value = demoValueFor(item.getResponseType().name());
            String observation = index % 2 == 0 ? "Sem anomalias." : null;
            appendAnswer(inspectionId, technicianId, item, value, observation,
                    base.plus(45L + index * 5L, ChronoUnit.MINUTES));
        }
    }

    private void appendAnswer(Long inspectionId, Long technicianId, InspectionItemSnapshot item,
            String value, String observation, Instant answeredAt) {
        answerHistoryService.record(inspectionId, item.getSourceTemplateItemId(), item.getSectionTitle(),
                item.getSectionOrder(), item.getItemTitle(), item.getItemOrder(), item.getResponseType(),
                value, observation, technicianId, answeredAt);
    }

    private String demoValueFor(String responseType) {
        return switch (responseType) {
            case "BOOLEAN" -> "true";
            case "NUMBER" -> "7.5";
            case "CONFORMITY" -> "CONFORMING";
            case "SINGLE_CHOICE" -> "Funcionando";
            case "DATE" -> LocalDate.now().toString();
            default -> "Verificado";
        };
    }

    /**
     * Seeds a coherent set of six demonstration inspections for the technician, varying priority
     * and due date so the mobile and admin lists show a realistic mix. One of them is canceled
     * through the real {@link InspectionService#cancel} flow to also exhibit a terminal state.
     *
     * @return the number of inspections created
     */
    private SeededInspections seedInspections(Long templateVersionId, Long clientId, Long siteId,
            Long equipmentId, Long technicianId, Long supervisorId) {
        record SeedInspection(String title, Priority priority, int dueInDays, String instructions) {
        }

        List<SeedInspection> plan = List.of(
                new SeedInspection("Inspecao Preventiva - Compressor de Ar XPTO 500",
                        Priority.MEDIUM, 7,
                        "Verificar condicao da bateria e nivel de oleo com atencao especial."),
                new SeedInspection("Inspecao de Seguranca - Compressor de Ar XPTO 500",
                        Priority.HIGH, 2,
                        "Priorizar verificacao das protecoes e do botao de emergencia."),
                new SeedInspection("Inspecao Corretiva - Compressor de Ar XPTO 500",
                        Priority.CRITICAL, 1,
                        "Equipamento com ruido anormal reportado; inspecionar antes de liberar."),
                new SeedInspection("Inspecao de Rotina - Compressor de Ar XPTO 500",
                        Priority.LOW, 14,
                        "Checklist mensal padrao, sem urgencia."),
                new SeedInspection("Inspecao Pos-Manutencao - Compressor de Ar XPTO 500",
                        Priority.MEDIUM, 4,
                        "Confirmar parametros de operacao apos troca de filtro."),
                new SeedInspection("Inspecao Cancelada - Compressor de Ar XPTO 500",
                        Priority.LOW, 10,
                        "Agendamento duplicado; sera cancelado para demonstracao."));

        Long canceledId = null;
        Long firstInspectionId = null;
        for (int index = 0; index < plan.size(); index++) {
            SeedInspection seed = plan.get(index);
            Long inspectionId = inspectionService.createInspection(new CreateInspectionRequest(
                    seed.title(), templateVersionId, clientId, siteId, equipmentId, technicianId,
                    seed.priority(), LocalDate.now().plusDays(seed.dueInDays()), null,
                    seed.instructions()), supervisorId).id();
            if (index == 0) {
                firstInspectionId = inspectionId;
            }
            // Cancel the last one to showcase a terminal state in the admin listing.
            if (index == plan.size() - 1) {
                canceledId = inspectionId;
            }
        }

        if (canceledId != null) {
            inspectionService.cancel(canceledId,
                    "Agendamento duplicado identificado durante o planejamento.", supervisorId);
        }

        return new SeededInspections(plan.size(), firstInspectionId);
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
