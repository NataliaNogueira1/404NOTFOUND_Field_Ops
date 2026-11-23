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
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.inspection.service.InspectionTemplateVersionService;
import com.fieldops.inspection.service.TemplateItemService;
import com.fieldops.inspection.service.TemplateSectionService;
import com.fieldops.site.dto.CreateSiteRequest;
import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.service.InspectionSiteService;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Creates a coherent, reproducible demonstration dataset (PBI-066 / #86): a realistic volume of
 * users, clients, sites, equipment, published inspection templates and inspections covering every
 * status of the lifecycle (≥2 per status). It reuses the dev users created by
 * {@link DevUsersBootstrapRunner} ({@code @Order} after it) and the domain services, so every
 * business rule is honoured.
 *
 * <p>Volume (#331 review): 9 users (2 admin, 3 supervisors, 4 technicians), 3 clients (each with
 * its own site), 5 published models with distinct checklists, 5 equipment distributed across the
 * clients/sites, and 14 inspections (2 per status) spread across the models, clients and
 * technicians so the lists show real variety.
 *
 * <p>Idempotent: guarded by the first client's document, so restarting the app does not duplicate
 * data. The additional demo users are created idempotently by email too. Active only under the
 * {@code dev} profile and when {@code fieldops.bootstrap.demo-seed.enabled}.
 */
@Component
@Profile({"dev", "demo"})
@Order(100) // after DevUsersBootstrapRunner so the demo users already exist
public class DemoSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSeedRunner.class);

    // Natural idempotency keys and coherent values.
    private static final String CLIENT_DOCUMENT_1 = "12.345.678/0001-90";
    private static final String CLIENT_DOCUMENT_2 = "98.765.432/0001-10";
    private static final String CLIENT_DOCUMENT_3 = "55.111.222/0001-33";
    private static final String SUPERVISOR_EMAIL = "supervisor@fieldops.local";
    private static final String TECHNICIAN_EMAIL = "technician@fieldops.local";
    private static final String ADMIN_EMAIL = "admin@fieldops.local";

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
    private final InspectionRepository inspectionRepository;
    private final InspectionItemSnapshotRepository snapshotRepository;
    private final InspectionAnswerHistoryService answerHistoryService;
    private final PasswordEncoder passwordEncoder;

    public DemoSeedRunner(DemoSeedProperties properties, UserRepository userRepository,
            ClientRepository clientRepository, EquipmentRepository equipmentRepository,
            ClientService clientService, InspectionSiteService siteService,
            EquipmentService equipmentService, InspectionTemplateService templateService,
            TemplateSectionService sectionService, TemplateItemService itemService,
            InspectionTemplateVersionService versionService, InspectionService inspectionService,
            InspectionRepository inspectionRepository,
            InspectionItemSnapshotRepository snapshotRepository,
            InspectionAnswerHistoryService answerHistoryService,
            PasswordEncoder passwordEncoder) {
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
        this.inspectionRepository = inspectionRepository;
        this.snapshotRepository = snapshotRepository;
        this.answerHistoryService = answerHistoryService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        // Idempotency: the first client's document is a stable natural key. If it exists, assume seeded.
        if (clientRepository.existsByDocument(CLIENT_DOCUMENT_1)) {
            log.info("Demo seed already present (client document {}); skipping.", CLIENT_DOCUMENT_1);
            return;
        }

        User admin = userRepository.findByEmail(ADMIN_EMAIL).orElse(null);
        User supervisor = userRepository.findByEmail(SUPERVISOR_EMAIL).orElse(null);
        User technician = userRepository.findByEmail(TECHNICIAN_EMAIL).orElse(null);
        if (admin == null || supervisor == null || technician == null) {
            log.warn("Demo seed skipped: expected dev users ({}, {}, {}) not found. "
                    + "Ensure DevUsersBootstrapRunner is enabled.", ADMIN_EMAIL, SUPERVISOR_EMAIL, TECHNICIAN_EMAIL);
            return;
        }

        // Additional demo users so the dataset shows variety (9 total: 2 admin, 3 supervisors, 4 technicians).
        // The 3 base dev users come from DevUsersBootstrapRunner; the remaining 6 are created here idempotently.
        User admin2 = createDemoUserIfMissing("Admin Demo Dois", "admin2@fieldops.local", Role.ADMINISTRATOR);
        User supervisor2 = createDemoUserIfMissing("Supervisora Marina Costa", "supervisor2@fieldops.local", Role.SUPERVISOR);
        User supervisor3 = createDemoUserIfMissing("Supervisor Bruno Lima", "supervisor3@fieldops.local", Role.SUPERVISOR);
        User technician2 = createDemoUserIfMissing("Tecnico Carlos Andrade", "technician2@fieldops.local", Role.TECHNICIAN);
        User technician3 = createDemoUserIfMissing("Tecnico Felipe Souza", "technician3@fieldops.local", Role.TECHNICIAN);
        User technician4 = createDemoUserIfMissing("Tecnico Ana Ribeiro", "technician4@fieldops.local", Role.TECHNICIAN);

        // Three distinct clients, each with its own site and associated equipment.
        ClientResponse client1 = clientService.create(new ClientRequest(
                "Industria Modelo Ltda.", "Industria Modelo", CLIENT_DOCUMENT_1,
                "contato@industriamodelo.com", "1533334444"));
        ClientResponse client2 = clientService.create(new ClientRequest(
                "Energetica Sul Ltda.", "Energetica Sul", CLIENT_DOCUMENT_2,
                "contato@energeticasul.com", "1544445555"));
        ClientResponse client3 = clientService.create(new ClientRequest(
                "Metalurgica Brasil SA", "Metalurgica Brasil", CLIENT_DOCUMENT_3,
                "contato@metalurgicabrasil.com", "1555556666"));

        SiteResponse site1 = siteService.create(new CreateSiteRequest(
                client1.id(), "Unidade Sorocaba - Galpao de Producao 02", "Galpao principal de producao",
                "Rod. Raposo Tavares km 100", "Sorocaba", "SP", "18000-000",
                null, null, "Marina Supervisora", "1533335555"));
        SiteResponse site2 = siteService.create(new CreateSiteRequest(
                client2.id(), "Unidade Campinas - Sala de Maquinas", "Casa de forca e quadros eletricos",
                "Av. Brasil 1500", "Campinas", "SP", "13000-000",
                null, null, "Paulo Responsavel", "1544446666"));
        SiteResponse site3 = siteService.create(new CreateSiteRequest(
                client3.id(), "Unidade Sao Paulo - Planta Industrial", "Linha de producao e utilidades",
                "Rua Industrial 200", "Sao Paulo", "SP", "01000-000",
                null, null, "Sandra Manutencao", "1555557777"));

        // Five equipment distributed across the three clients/sites.
        EquipmentResponse equipment1 = equipmentService.create(new EquipmentRequest(
                site1.id(), "Compressor de Ar XPTO 500", "PAT-500", "SN-XPTO-500",
                "Atlas", "XPTO 500", "Compressor industrial de ar", "COMP-004",
                EquipmentStatus.ACTIVE, LocalDate.of(2024, 1, 15)));
        EquipmentResponse equipment2 = equipmentService.create(new EquipmentRequest(
                site2.id(), "Gerador Diesel 200 kVA", "PAT-201", "SN-GEN-200",
                "WEG", "G200", "Gerador de energia de emergencia", "GER-101",
                EquipmentStatus.ACTIVE, LocalDate.of(2023, 6, 10)));
        EquipmentResponse equipment3 = equipmentService.create(new EquipmentRequest(
                site2.id(), "Painel Eletrico Industrial", "PAT-202", "SN-PAIN-001",
                "WEG", "PEI-300", "Quadro de distribuicao eletrica", "PAIN-202",
                EquipmentStatus.ACTIVE, LocalDate.of(2024, 3, 1)));
        EquipmentResponse equipment4 = equipmentService.create(new EquipmentRequest(
                site3.id(), "Bomba Hidraulica Centrifuga", "PAT-303", "SN-BOMB-100",
                "KSB", "BHC-50", "Bomba para circulacao de fluidos", "BOMB-303",
                EquipmentStatus.ACTIVE, LocalDate.of(2023, 11, 20)));
        EquipmentResponse equipment5 = equipmentService.create(new EquipmentRequest(
                site3.id(), "Trocador de Calor a Placas", "PAT-404", "SN-TROC-200",
                "Alfa Laval", "TCP-15", "Trocador de calor para resfriamento", "TROC-404",
                EquipmentStatus.ACTIVE, LocalDate.of(2024, 2, 5)));

        // Five published models with distinct checklists.
        Long templateVersion1 = seedCompressorTemplate(supervisor.getId());
        Long templateVersion2 = seedGeneratorTemplate(supervisor.getId());
        Long templateVersion3 = seedElectricalPanelTemplate(supervisor.getId());
        Long templateVersion4 = seedHydraulicPumpTemplate(supervisor.getId());
        Long templateVersion5 = seedElectricalSafetyTemplate(supervisor.getId());

        // Resolve the full user roster for the inspection plan.
        User[] supervisors = {supervisor, supervisor2, supervisor3};
        User[] technicians = {technician, technician2, technician3, technician4};

        Long firstInspectionId = seedInspections(
                List.of(templateVersion1, templateVersion2, templateVersion3, templateVersion4, templateVersion5),
                List.of(client1, client2, client3),
                List.of(site1, site2, site3),
                List.of(equipment1, equipment2, equipment3, equipment4, equipment5),
                supervisors, technicians);

        // Seed a detailed answer history (PBI-088) on the first inspection so the admin can see a
        // realistic timeline, including an item answered more than once over time.
        seedAnswerHistory(firstInspectionId, technicians[0].getId());

        log.info("Demo seed created: 3 clients, 3 sites, 5 equipment, 5 published models, "
                + "14 inspections (2 per status) distributed across {} technicians and {} supervisors.",
                technicians.length, supervisors.length);
    }

    /**
     * Creates an additional demo user idempotently (by email). Reused to reach the #331 target
     * volume of 9 users (2 admin, 3 supervisors, 4 technicians).
     */
    private User createDemoUserIfMissing(String name, String email, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setRole(role);
            user.setStatus(UserStatus.ACTIVE);
            user.setPassword(passwordEncoder.encode("fieldops-demo-dev"));
            return userRepository.save(user);
        });
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

    /** Inspection plan row: target status plus all the references needed to create it. */
    private record PlannedInspection(
            InspectionStatus targetStatus,
            String title,
            Long templateVersionId,
            Long clientId,
            Long siteId,
            Long equipmentId,
            Long technicianId,
            Long supervisorId,
            Priority priority,
            int dueInDays,
            String instructions) {
    }

    /**
     * Seeds 14 inspections (2 per lifecycle status) distributed across the 5 models, 3 clients,
     * 4 technicians and 5 equipment so the mobile and admin lists show real variety (#331).
     *
     * <p>Each inspection is created through the real {@link InspectionService#createInspection} flow
     * (born ASSIGNED with a frozen checklist) and driven to its target status using the real domain
     * transitions where they exist: {@link InspectionService#beginReview} (SUBMITTED → UNDER_REVIEW),
     * {@link InspectionService#approve} and {@link InspectionService#reject} (UNDER_REVIEW → terminal),
     * and {@link InspectionService#cancel}. IN_PROGRESS and SUBMITTED are mobile-owned transitions
     * with no server method, so the status is set directly on the entity (same pattern already used
     * in the codebase). For APPROVED/REJECTED, the inspection is advanced to SUBMITTED then taken
     * through beginReview, so the reviewer, reason and audit trail are populated exactly as in
     * production.
     *
     * @return the id of the first created inspection (for answer-history seeding)
     */
    private Long seedInspections(List<Long> templateVersionIds, List<ClientResponse> clients,
            List<SiteResponse> sites, List<EquipmentResponse> equipment,
            User[] supervisors, User[] technicians) {
        // Distribute references across models/clients/sites/equipment/technicians/supervisors.
        Long tpl1 = templateVersionIds.get(0), tpl2 = templateVersionIds.get(1),
                tpl3 = templateVersionIds.get(2), tpl4 = templateVersionIds.get(3),
                tpl5 = templateVersionIds.get(4);
        Long c1 = clients.get(0).id(), c2 = clients.get(1).id(), c3 = clients.get(2).id();
        Long s1 = sites.get(0).id(), s2 = sites.get(1).id(), s3 = sites.get(2).id();
        Long eq1 = equipment.get(0).id(), eq2 = equipment.get(1).id(), eq3 = equipment.get(2).id(),
                eq4 = equipment.get(3).id(), eq5 = equipment.get(4).id();
        Long tec1 = technicians[0].getId(), tec2 = technicians[1].getId(),
                tec3 = technicians[2].getId(), tec4 = technicians[3].getId();
        Long sup1 = supervisors[0].getId(), sup2 = supervisors[1].getId(),
                sup3 = supervisors[2].getId();

        List<PlannedInspection> plan = List.of(
                // ASSIGNED (2) — fresh, no transition.
                new PlannedInspection(InspectionStatus.ASSIGNED,
                        "Inspecao Preventiva - Compressor de Ar XPTO 500",
                        tpl1, c1, s1, eq1, tec1, sup1, Priority.MEDIUM, 7,
                        "Verificar condicao da bateria e nivel de oleo com atencao especial."),
                new PlannedInspection(InspectionStatus.ASSIGNED,
                        "Inspecao Preventiva - Gerador Diesel 200 kVA",
                        tpl2, c2, s2, eq2, tec2, sup2, Priority.HIGH, 2,
                        "Priorizar verificacao das protecoes e do botao de emergencia."),

                // IN_PROGRESS (2) — mobile-owned, set directly.
                new PlannedInspection(InspectionStatus.IN_PROGRESS,
                        "Inspecao de Rotina - Painel Eletrico Industrial",
                        tpl3, c2, s2, eq3, tec3, sup3, Priority.LOW, 14,
                        "Checklist mensal padrao, sem urgencia."),
                new PlannedInspection(InspectionStatus.IN_PROGRESS,
                        "Inspecao Corretiva - Bomba Hidraulica Centrifuga",
                        tpl4, c3, s3, eq4, tec4, sup1, Priority.CRITICAL, 1,
                        "Equipamento com ruido anormal reportado; inspecionar antes de liberar."),

                // SUBMITTED (2) — mobile-owned, set directly.
                new PlannedInspection(InspectionStatus.SUBMITTED,
                        "Inspecao Preventiva - Compressor de Ar XPTO 500",
                        tpl1, c1, s1, eq1, tec1, sup2, Priority.MEDIUM, 3,
                        "Concluida pelo tecnico; aguardando o supervisor iniciar a revisao."),
                new PlannedInspection(InspectionStatus.SUBMITTED,
                        "Inspecao de Seguranca Eletrica - Trocador de Calor",
                        tpl5, c3, s3, eq5, tec2, sup3, Priority.HIGH, 3,
                        "Verificacao de aterramento e protecoes; aguardando revisao."),

                // UNDER_REVIEW (2) — via beginReview (SUBMITTED → UNDER_REVIEW).
                new PlannedInspection(InspectionStatus.UNDER_REVIEW,
                        "Inspecao Preventiva - Gerador Diesel 200 kVA",
                        tpl2, c2, s2, eq2, tec3, sup1, Priority.MEDIUM, 4,
                        "Em revisao pelo supervisor; pronta para aprovar/reprovar e comentar por item."),
                new PlannedInspection(InspectionStatus.UNDER_REVIEW,
                        "Inspecao de Painel Eletrico Industrial",
                        tpl3, c2, s2, eq3, tec4, sup2, Priority.HIGH, 5,
                        "Em revisao; conferir conformidades antes de aprovar."),

                // APPROVED (2) — via beginReview → approve (real review decision + audit).
                new PlannedInspection(InspectionStatus.APPROVED,
                        "Inspecao de Bomba Hidraulica Centrifuga",
                        tpl4, c3, s3, eq4, tec1, sup3, Priority.MEDIUM, 6,
                        "Concluida e aprovada pelo supervisor."),
                new PlannedInspection(InspectionStatus.APPROVED,
                        "Inspecao de Seguranca Eletrica - Trocador de Calor",
                        tpl5, c3, s3, eq5, tec2, sup1, Priority.LOW, 8,
                        "Verificacao concluida e aprovada sem ressalvas."),

                // REJECTED (2) — via beginReview → reject (real review decision + reason + audit).
                new PlannedInspection(InspectionStatus.REJECTED,
                        "Inspecao Preventiva - Compressor de Ar XPTO 500",
                        tpl1, c1, s1, eq1, tec3, sup2, Priority.HIGH, 5,
                        "Enviada com evidencia insuficiente; reprovada para correcao."),
                new PlannedInspection(InspectionStatus.REJECTED,
                        "Inspecao Preventiva - Gerador Diesel 200 kVA",
                        tpl2, c2, s2, eq2, tec4, sup3, Priority.CRITICAL, 4,
                        "Nao conformidade critica identificada; reprovada para retrabalho."),

                // CANCELED (2) — via cancel (terminal state, fills reason/author/audit).
                new PlannedInspection(InspectionStatus.CANCELED,
                        "Inspecao de Painel Eletrico Industrial",
                        tpl3, c2, s2, eq3, tec1, sup1, Priority.LOW, 10,
                        "Agendamento duplicado; sera cancelado para demonstracao."),
                new PlannedInspection(InspectionStatus.CANCELED,
                        "Inspecao de Bomba Hidraulica Centrifuga",
                        tpl4, c3, s3, eq4, tec2, sup2, Priority.MEDIUM, 9,
                        "Equipamento em manutencao corretiva; inspecao cancelada."));

        Long firstInspectionId = null;
        for (int index = 0; index < plan.size(); index++) {
            PlannedInspection seed = plan.get(index);
            Long inspectionId = inspectionService.createInspection(new CreateInspectionRequest(
                    seed.title(), seed.templateVersionId(), seed.clientId(), seed.siteId(),
                    seed.equipmentId(), seed.technicianId(), seed.priority(),
                    LocalDate.now().plusDays(seed.dueInDays()), null, seed.instructions()),
                    seed.supervisorId()).id();
            if (index == 0) {
                firstInspectionId = inspectionId;
            }
            driveToTargetStatus(inspectionId, seed.targetStatus(), seed.supervisorId());
        }
        return firstInspectionId;
    }

    /**
     * Drives a freshly created ASSIGNED inspection to its target status. Real domain transitions
     * are used where they exist: SUBMITTED → UNDER_REVIEW ({@link InspectionService#beginReview}),
     * UNDER_REVIEW → APPROVED/REJECTED ({@link InspectionService#approve} / {@link InspectionService#reject}),
     * and cancel from a cancelable status. IN_PROGRESS and SUBMITTED are mobile-owned transitions
     * with no server method, so the status is set directly on the entity (the same pattern already
     * used in this codebase).
     */
    private void driveToTargetStatus(Long inspectionId, InspectionStatus target, Long reviewerId) {
        switch (target) {
            case ASSIGNED -> { /* born ASSIGNED, nothing to do */ }
            case IN_PROGRESS, SUBMITTED -> advanceStatus(inspectionId, target);
            case UNDER_REVIEW -> {
                advanceStatus(inspectionId, InspectionStatus.SUBMITTED);
                inspectionService.beginReview(inspectionId, reviewerId);
            }
            case APPROVED -> {
                advanceStatus(inspectionId, InspectionStatus.SUBMITTED);
                inspectionService.beginReview(inspectionId, reviewerId);
                inspectionService.approve(inspectionId, "Conforme; liberado para uso.", reviewerId);
            }
            case REJECTED -> {
                advanceStatus(inspectionId, InspectionStatus.SUBMITTED);
                inspectionService.beginReview(inspectionId, reviewerId);
                inspectionService.reject(inspectionId,
                        "Evidencia fotografica do item de carcaca esta ilegivel; refazer a foto e reenviar.",
                        reviewerId);
            }
            case CANCELED -> inspectionService.cancel(inspectionId,
                    "Agendamento duplicado identificado durante o planejamento.", reviewerId);
            default -> { /* DRAFT is not part of the demo plan */ }
        }
    }

    /**
     * Advances a freshly created ASSIGNED inspection to the given mobile-owned status on the
     * persisted entity, scoped to the demo seed. The mobile submit and the start transitions are
     * driven by the mobile app in production; here the status is set directly so the demo dataset
     * ships inspections ready for review without any manual setup.
     */
    private void advanceStatus(Long inspectionId, InspectionStatus status) {
        Inspection inspection = inspectionRepository.findById(inspectionId).orElseThrow();
        inspection.setStatus(status);
        inspectionRepository.save(inspection);
    }

    // ─── Published templates (5 distinct checklists) ───────────────────────────────

    /** Compressor checklist. */
    private Long seedCompressorTemplate(Long publisherId) {
        InspectionTemplateResponse template = templateService.createDraft(new InspectionTemplateRequest(
                "Inspecao Preventiva de Compressor", "Checklist mensal de manutencao preventiva",
                "Compressores"), publisherId);
        Long templateId = template.id();
        sectionService.create(templateId, new TemplateSectionRequest("Condicoes Gerais", "Estado geral do equipamento", 1));
        sectionService.create(templateId, new TemplateSectionRequest("Funcionamento", "Parametros de operacao", 2));
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
        return versionService.publish(templateId, publisherId).id();
    }

    /** Generator checklist. */
    private Long seedGeneratorTemplate(Long publisherId) {
        InspectionTemplateResponse template = templateService.createDraft(new InspectionTemplateRequest(
                "Inspecao Preventiva de Gerador", "Checklist de gerador de emergencia",
                "Geradores"), publisherId);
        Long templateId = template.id();
        sectionService.create(templateId, new TemplateSectionRequest("Combustivel e Lubrificacao", "Niveis e vazamentos", 1));
        sectionService.create(templateId, new TemplateSectionRequest("Sistema Eletrico", "Bateria e painel", 2));
        List<TemplateSectionResponse> sections = templateService.getById(templateId).sections();
        Long fuelId = sectionByOrder(sections, 1);
        Long elecId = sectionByOrder(sections, 2);
        itemService.create(templateId, fuelId, new TemplateItemRequest(
                "Nivel de combustivel no reservatorio?", null,
                ResponseType.BOOLEAN, true, false, false, null, 1));
        itemService.create(templateId, fuelId, new TemplateItemRequest(
                "Vazamentos no sistema de combustivel?", "Inspecionar linhas e conexoes",
                ResponseType.CONFORMITY, true, true, true, null, 2));
        itemService.create(templateId, elecId, new TemplateItemRequest(
                "Tensao da bateria (V)", "Medir com multimetro",
                ResponseType.NUMBER, true, false, false, null, 1));
        itemService.create(templateId, elecId, new TemplateItemRequest(
                "Estado de conservacao dos bornes?", null,
                ResponseType.CONFORMITY, false, false, false, null, 2));
        return versionService.publish(templateId, publisherId).id();
    }

    /** Electrical panel checklist. */
    private Long seedElectricalPanelTemplate(Long publisherId) {
        InspectionTemplateResponse template = templateService.createDraft(new InspectionTemplateRequest(
                "Inspecao de Painel Eletrico", "Checklist de quadro de distribuicao",
                "Paineis Eletricos"), publisherId);
        Long templateId = template.id();
        sectionService.create(templateId, new TemplateSectionRequest("Protecoes", "Disjuntores e DR", 1));
        sectionService.create(templateId, new TemplateSectionRequest("Aterramento e Conexoes", "Integridade das conexoes", 2));
        List<TemplateSectionResponse> sections = templateService.getById(templateId).sections();
        Long protId = sectionByOrder(sections, 1);
        Long earthId = sectionByOrder(sections, 2);
        itemService.create(templateId, protId, new TemplateItemRequest(
                "Disjuntores operando conforme escala?", null,
                ResponseType.CONFORMITY, true, true, true, null, 1));
        itemService.create(templateId, protId, new TemplateItemRequest(
                "Tipo de DR instalado", null,
                ResponseType.SINGLE_CHOICE, true, false, false,
                List.of("Falta instalar", "Instalado e funcionando", "Instalado com defeito"), 2));
        itemService.create(templateId, earthId, new TemplateItemRequest(
                "Resistencia de aterramento (ohm)", "Medir com alicate",
                ResponseType.NUMBER, true, true, false, null, 1));
        return versionService.publish(templateId, publisherId).id();
    }

    /** Hydraulic pump checklist. */
    private Long seedHydraulicPumpTemplate(Long publisherId) {
        InspectionTemplateResponse template = templateService.createDraft(new InspectionTemplateRequest(
                "Inspecao de Bomba Hidraulica", "Checklist de bomba centrifuga",
                "Bombas"), publisherId);
        Long templateId = template.id();
        sectionService.create(templateId, new TemplateSectionRequest("Vedacoes e Vazamentos", "Inspecao de selos e gaxetas", 1));
        sectionService.create(templateId, new TemplateSectionRequest("Operacao", "Vazao e pressao", 2));
        List<TemplateSectionResponse> sections = templateService.getById(templateId).sections();
        Long sealId = sectionByOrder(sections, 1);
        Long opId = sectionByOrder(sections, 2);
        itemService.create(templateId, sealId, new TemplateItemRequest(
                "Selo mecanico com vazamento?", "Verificar presenca de umidade",
                ResponseType.CONFORMITY, true, true, true, null, 1));
        itemService.create(templateId, sealId, new TemplateItemRequest(
                "Gaxeta ajustada corretamente?", null,
                ResponseType.BOOLEAN, true, false, false, null, 2));
        itemService.create(templateId, opId, new TemplateItemRequest(
                "Vazao da bomba (m3/h)", "Registrar vazao medida",
                ResponseType.NUMBER, true, false, false, null, 1));
        return versionService.publish(templateId, publisherId).id();
    }

    /** General electrical safety checklist (applies to any equipment with electrical parts). */
    private Long seedElectricalSafetyTemplate(Long publisherId) {
        InspectionTemplateResponse template = templateService.createDraft(new InspectionTemplateRequest(
                "Inspecao de Seguranca Eletrica", "Checklist de seguranca eletrica generalista",
                "Seguranca"), publisherId);
        Long templateId = template.id();
        sectionService.create(templateId, new TemplateSectionRequest("Aterramento", "Continuidade e resistencia", 1));
        sectionService.create(templateId, new TemplateSectionRequest("Sinalizacao e Protecao", "EPI e sinalizacao", 2));
        List<TemplateSectionResponse> sections = templateService.getById(templateId).sections();
        Long earthId = sectionByOrder(sections, 1);
        Long signId = sectionByOrder(sections, 2);
        itemService.create(templateId, earthId, new TemplateItemRequest(
                "Continuidade do aterramento confirmada?", null,
                ResponseType.CONFORMITY, true, true, true, null, 1));
        itemService.create(templateId, earthId, new TemplateItemRequest(
                "Data da ultima medicao de aterramento", null,
                ResponseType.DATE, false, false, false, null, 2));
        itemService.create(templateId, signId, new TemplateItemRequest(
                "Sinalizacao de area de risco presente?", null,
                ResponseType.BOOLEAN, true, false, false, null, 1));
        itemService.create(templateId, signId, new TemplateItemRequest(
                "EPI necessario disponivel?", null,
                ResponseType.CONFORMITY, true, true, false, null, 2));
        return versionService.publish(templateId, publisherId).id();
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
