package com.fieldops.inspection.controller;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.repository.AuditEventRepository;
import com.fieldops.audit.service.InspectionAnswerHistoryService;
import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.inspection.repository.TemplateItemRepository;
import com.fieldops.inspection.repository.TemplateSectionRepository;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.time.LocalDate;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for approve/reject decisions (PBI-060 / PBI-061).
 * Uses a real Bearer JWT so the reviewer (AuthenticatedUser) is recorded.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReviewInspectionControllerTest {

    private static final Path EVIDENCE_ROOT = createEvidenceRoot();

    @DynamicPropertySource
    static void evidenceStorage(DynamicPropertyRegistry registry) {
        registry.add("fieldops.storage.evidence-dir", () -> EVIDENCE_ROOT.toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private InspectionTemplateRepository templateRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired private InspectionItemSnapshotRepository snapshotRepository;
    @Autowired private TemplateSectionRepository sectionRepository;
    @Autowired private TemplateItemRepository itemRepository;
    @Autowired private InspectionAnswerHistoryService answerHistoryService;
    @Autowired private InspectionEvidenceRepository evidenceRepository;
    @Autowired private NonConformityRepository nonConformityRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private TransactionTemplate transactionTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User supervisor;
    private User technician;
    private InspectionTemplate template;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        template = persistTemplate(supervisor);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    private void cleanState() {
        nonConformityRepository.deleteAll();
        evidenceRepository.deleteAll();
        snapshotRepository.deleteAll();
        itemRepository.deleteAll();
        sectionRepository.deleteAll();
        auditEventRepository.deleteAll();
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void approvesInspectionUnderReviewAndRecordsAudit() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.UNDER_REVIEW);
        String token = obtainToken();

        mockMvc.perform(post("/api/v1/inspections/{id}/approve", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Tudo conforme, aprovado.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewedAt").isNotEmpty())
                .andExpect(jsonPath("$.reviewedBy").value(supervisor.getId().toString()))
                .andExpect(jsonPath("$.comment").value("Tudo conforme, aprovado."));

        Inspection reloaded = inspectionRepository.findById(inspection.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(InspectionStatus.APPROVED);
        assertThat(reloaded.getReviewedBy().getId()).isEqualTo(supervisor.getId());
        assertThat(reloaded.getReviewComment()).isEqualTo("Tudo conforme, aprovado.");

        // The approval is recorded in the audit trail (PBI-063 wiring).
        assertThat(auditEventRepository.findAll())
                .anySatisfy(event -> {
                    assertThat(event.getAction()).isEqualTo(AuditAction.INSPECTION_APPROVED);
                    assertThat(event.getEntityId()).isEqualTo(inspection.getId());
                    assertThat(event.getActorId()).isEqualTo(supervisor.getId());
                });
    }

    @Test
    void approvesWithoutCommentWhenBodyIsAbsent() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.UNDER_REVIEW);
        String token = obtainToken();

        mockMvc.perform(post("/api/v1/inspections/{id}/approve", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void rejectsInspectionUnderReviewWithReason() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.UNDER_REVIEW);
        String token = obtainToken();

        mockMvc.perform(post("/api/v1/inspections/{id}/reject", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Faltam evidencias no item 3, refazer.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Faltam evidencias no item 3, refazer."));

        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.REJECTED);
    }

    @Test
    void rejectsWithShortReasonReturns400() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.UNDER_REVIEW);
        String token = obtainToken();

        mockMvc.perform(post("/api/v1/inspections/{id}/reject", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"curto\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void refusesApprovalWhenNotUnderReviewWith422() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken();

        mockMvc.perform(post("/api/v1/inspections/{id}/approve", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.ASSIGNED);
    }

    @Test
    void returnsNotFoundForUnknownInspection() throws Exception {
        String token = obtainToken();

        mockMvc.perform(post("/api/v1/inspections/{id}/approve", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void reviewEndpointAllowsSupervisorAndRejectsUnauthenticatedOrTechnician() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.UNDER_REVIEW);

        mockMvc.perform(get("/api/v1/inspections/{id}/review", inspection.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/inspections/{id}/review", inspection.getId())
                        .header("Authorization", "Bearer " + obtainToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(inspection.getId().toString()))
                .andExpect(jsonPath("$.technicianName").value(technician.getName()))
                .andExpect(jsonPath("$.sections").isArray());

        mockMvc.perform(get("/api/v1/inspections/{id}/review", inspection.getId())
                        .header("Authorization", "Bearer " + obtainTechnicianToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void reviewEndpointReturnsNotFoundForUnknownInspection() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/{id}/review", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + obtainToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void reviewReturnsLatestAnswersAndOnlyItemScopedEvidenceAndNonConformities() throws Exception {
        Inspection inspectionA = saveInspection(InspectionStatus.UNDER_REVIEW);
        Inspection inspectionB = saveInspection(InspectionStatus.UNDER_REVIEW);
        TemplateSection safety = persistSection("Safety", 1);
        TemplateSection electrical = persistSection("Electrical", 2);
        TemplateItem itemA = persistItem(safety, "Guard installed", 1);
        TemplateItem itemB = persistItem(electrical, "Panel labelled", 1);
        InspectionItemSnapshot snapshotA = saveSnapshot(inspectionA, safety, itemA);
        InspectionItemSnapshot snapshotB = saveSnapshot(inspectionA, electrical, itemB);
        InspectionItemSnapshot snapshotOtherInspection = saveSnapshot(inspectionB, safety, itemA);

        answerHistoryService.record(inspectionA.getId(), itemA.getId(), "Safety", 1, "Guard installed", 1,
                ResponseType.CONFORMITY, "NON_CONFORMING", "Old observation", technician.getId(), Instant.parse("2026-01-01T10:00:00Z"));
        answerHistoryService.record(inspectionA.getId(), itemA.getId(), "Safety", 1, "Guard installed", 1,
                ResponseType.CONFORMITY, "CONFORMING", "Latest observation", technician.getId(), Instant.parse("2026-01-01T11:00:00Z"));
        evidenceRepository.save(InspectionEvidence.create(inspectionA, snapshotA, "review/a.jpg", "checksum-a", "Evidence A", "Linha 1", Instant.parse("2026-01-01T12:00:00Z"), technician));
        evidenceRepository.save(InspectionEvidence.create(inspectionA, snapshotB, "https://storage/b.jpg", "checksum-b", "Evidence B", Instant.now(), technician));
        evidenceRepository.save(InspectionEvidence.create(inspectionB, snapshotOtherInspection, "https://storage/other.jpg", "checksum-other", "Other inspection", Instant.now(), technician));
        persistNonConformity(inspectionA.getId(), snapshotA.getId(), "NC A");
        persistNonConformity(inspectionA.getId(), snapshotB.getId(), "NC B");
        persistNonConformity(inspectionB.getId(), snapshotOtherInspection.getId(), "NC other inspection");
        mockMvc.perform(get("/api/v1/inspections/{id}/review", inspectionA.getId())
                        .header("Authorization", "Bearer " + obtainToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(inspectionA.getId().toString()))
                .andExpect(jsonPath("$.technicianName").value(technician.getName()))
                .andExpect(jsonPath("$.sections[0].title").value("Safety"))
                .andExpect(jsonPath("$.sections[0].items[0].title").value("Guard installed"))
                .andExpect(jsonPath("$.sections[0].items[0].answer").value("CONFORMING"))
                .andExpect(jsonPath("$.sections[0].items[0].observation").value("Latest observation"))
                .andExpect(jsonPath("$.sections[0].items[0].evidences[0].reference").value("review/a.jpg"))
                .andExpect(jsonPath("$.sections[0].items[0].evidences[0].contentUrl").value(org.hamcrest.Matchers.endsWith("/content")))
                .andExpect(jsonPath("$.sections[0].items[0].evidences[0].capturedAt").value("2026-01-01T12:00:00Z"))
                .andExpect(jsonPath("$.sections[0].items[0].evidences[0].location").value("Linha 1"))
                .andExpect(jsonPath("$.sections[0].items[0].evidences[0].itemSnapshotId").value(snapshotA.getId().toString()))
                .andExpect(jsonPath("$.sections[0].items[0].evidences[1]").doesNotExist())
                .andExpect(jsonPath("$.sections[0].items[0].nonConformities[0].title").value("NC A"))
                .andExpect(jsonPath("$.sections[1].items[0].evidences[0].reference").value("https://storage/b.jpg"))
                .andExpect(jsonPath("$.sections[1].items[0].evidences[0].location").isEmpty())
                .andExpect(jsonPath("$.sections[1].items[0].nonConformities[0].title").value("NC B"))
                .andExpect(jsonPath("$.nonConformities.length()").value(2))
                .andExpect(jsonPath("$.sections..evidences..reference").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem("https://storage/other.jpg"))))
                .andExpect(jsonPath("$.nonConformities..title").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem("NC other inspection"))));
    }

    @Test
    void servesProtectedEvidenceContentAndDoesNotSubstituteAnotherInspectionFile() throws Exception {
        Inspection inspectionA = saveInspection(InspectionStatus.UNDER_REVIEW);
        Inspection inspectionB = saveInspection(InspectionStatus.UNDER_REVIEW);
        TemplateSection section = persistSection("Evidence", 1);
        TemplateItem item = persistItem(section, "Photograph", 1);
        InspectionItemSnapshot snapshotA = saveSnapshot(inspectionA, section, item);
        InspectionItemSnapshot snapshotB = saveSnapshot(inspectionB, section, item);
        Files.createDirectories(EVIDENCE_ROOT.resolve("inspection-a"));
        Files.write(EVIDENCE_ROOT.resolve("inspection-a/photo.jpg"), new byte[] {1, 2, 3, 4});
        InspectionEvidence evidenceA = evidenceRepository.save(InspectionEvidence.create(inspectionA, snapshotA,
                "inspection-a/photo.jpg", "checksum-a", "Photo", "Area externa", Instant.parse("2026-02-01T10:00:00Z"), technician));
        InspectionEvidence missing = evidenceRepository.save(InspectionEvidence.create(inspectionA, snapshotA,
                "inspection-a/missing.jpg", "checksum-missing", "Missing", null, Instant.now(), technician));
        InspectionEvidence evidenceB = evidenceRepository.save(InspectionEvidence.create(inspectionB, snapshotB,
                "inspection-b/other.jpg", "checksum-b", "Other", null, Instant.now(), technician));

        mockMvc.perform(get("/api/v1/inspection-evidences/{id}/content", evidenceA.getId()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/inspection-evidences/{id}/content", evidenceA.getId())
                        .header("Authorization", "Bearer " + obtainTechnicianToken()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/inspection-evidences/{id}/content", evidenceA.getId())
                        .header("Authorization", "Bearer " + obtainToken()))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.IMAGE_JPEG))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes(new byte[] {1, 2, 3, 4}));
        mockMvc.perform(get("/api/v1/inspection-evidences/{id}/content", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + obtainToken()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/inspection-evidences/{id}/content", missing.getId())
                        .header("Authorization", "Bearer " + obtainToken()))
                .andExpect(status().isNotFound());
        assertThat(evidenceA.getInspection().getId()).isNotEqualTo(evidenceB.getInspection().getId());
    }

    private static Path createEvidenceRoot() {
        try { return Files.createTempDirectory("fieldops-evidence-"); }
        catch (java.io.IOException exception) { throw new IllegalStateException(exception); }
    }

    // --- fixtures ---

    private User persistUser(String email, Role role) {
        User user = new User();
        user.setName("User " + email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("pass123"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private InspectionTemplate persistTemplate(User creator) {
        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Electrical inspection");
        template.setCategory("ELECTRICAL");
        template.setVersion(1);
        template.setPublished(true);
        template.setCreatedBy(creator);
        return templateRepository.save(template);
    }

    private Inspection saveInspection(InspectionStatus status) {
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection " + status);
        inspection.setTemplate(template);
        inspection.setClientName("Acme Co");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Panel A");
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(status);
        inspection.setPriority(Priority.MEDIUM);
        inspection.setDueDate(LocalDate.now().plusDays(1));
        return inspectionRepository.save(inspection);
    }

    private String obtainToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sup@fieldops.com\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private TemplateSection persistSection(String title, int order) {
        TemplateSection section = new TemplateSection();
        section.setTemplate(template);
        section.setTitle(title);
        section.setDisplayOrder(order);
        return sectionRepository.save(section);
    }

    private TemplateItem persistItem(TemplateSection section, String question, int order) {
        TemplateItem item = new TemplateItem();
        item.setSection(section);
        item.setQuestion(question);
        item.setResponseType(ResponseType.CONFORMITY);
        item.setRequired(true);
        item.setDisplayOrder(order);
        return itemRepository.save(item);
    }

    private InspectionItemSnapshot saveSnapshot(Inspection inspection, TemplateSection section, TemplateItem item) {
        return snapshotRepository.save(InspectionItemSnapshot.from(inspection, section, item));
    }

    private void persistNonConformity(Long inspectionId, Long snapshotId, String title) {
        transactionTemplate.executeWithoutResult(status -> entityManager.createNativeQuery("""
                    INSERT INTO non_conformities (inspection_id, inspection_item_snapshot_id, title, description, severity, status, created_at)
                    VALUES (:inspectionId, :snapshotId, :title, 'Persisted fixture', 'HIGH', 'OPEN', CURRENT_TIMESTAMP)
                    """)
                    .setParameter("inspectionId", inspectionId)
                    .setParameter("snapshotId", snapshotId)
                    .setParameter("title", title)
                    .executeUpdate());
    }

    private String obtainTechnicianToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tech@fieldops.com\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
