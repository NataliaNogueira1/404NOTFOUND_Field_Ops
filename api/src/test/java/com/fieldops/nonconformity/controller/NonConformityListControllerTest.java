package com.fieldops.nonconformity.controller;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.audit.model.AuditEvent;
import com.fieldops.audit.repository.AuditEventRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.inspection.repository.TemplateItemRepository;
import com.fieldops.inspection.repository.TemplateSectionRepository;
import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the paginated, filterable list endpoint
 * {@code GET /api/v1/non-conformities} (PBI-228 / EP-10).
 *
 * Covers authorization (ADMINISTRATOR/SUPERVISOR allowed, TECHNICIAN denied, no token 401),
 * the status/severity/inspectionId/client filters, pagination metadata, and the response contract
 * (createdAt present, updatedAt absent).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NonConformityListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NonConformityRepository nonConformityRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private InspectionEvidenceRepository evidenceRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private InspectionTemplateRepository templateRepository;

    @Autowired
    private InspectionItemSnapshotRepository snapshotRepository;

    @Autowired
    private TemplateSectionRepository sectionRepository;

    @Autowired
    private TemplateItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User supervisor;
    private User technician;
    private InspectionTemplate template;
    private Inspection acmeInspection;
    private Inspection globexInspection;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        persistUser("admin@fieldops.com", Role.ADMINISTRATOR);
        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        template = persistTemplate(supervisor);

        acmeInspection = saveInspection("Acme Co");
        globexInspection = saveInspection("Globex Corp");

        // Acme: one OPEN CRITICAL, one CLOSED LOW.
        saveNonConformity(acmeInspection, "Leak", NonConformitySeverity.CRITICAL, NonConformityStatus.OPEN);
        saveClosedNonConformity(acmeInspection, "Old issue", NonConformitySeverity.LOW);
        // Globex: one OPEN MEDIUM.
        saveNonConformity(globexInspection, "Noise", NonConformitySeverity.MEDIUM, NonConformityStatus.OPEN);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    private void cleanState() {
        nonConformityRepository.deleteAll();
        auditEventRepository.deleteAll();
        evidenceRepository.deleteAll();
        inspectionRepository.deleteAll();
        snapshotRepository.deleteAll();
        itemRepository.deleteAll();
        sectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // a. SUPERVISOR gets a paginated list (200).
    @Test
    void supervisorListsAllNonConformities() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content.length()").value(3));
    }

    // b. ADMINISTRATOR gets a paginated list (200).
    @Test
    void administratorListsAllNonConformities() throws Exception {
        String token = obtainToken("admin@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    // c. TECHNICIAN is forbidden (403).
    @Test
    void technicianIsForbidden() throws Exception {
        String token = obtainToken("tech@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // d. No token returns 401 with the standardized body.
    @Test
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/non-conformities"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // e. status=OPEN returns only the two OPEN rows.
    @Test
    void filtersByStatusOpen() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").param("status", "OPEN")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    // e2. status=CLOSED returns only the single CLOSED row.
    @Test
    void filtersByStatusClosed() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").param("status", "CLOSED")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("CLOSED"));
    }

    // f. severity=CRITICAL returns only the critical row.
    @Test
    void filtersBySeverity() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").param("severity", "CRITICAL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].severity").value("CRITICAL"));
    }

    // g. inspectionId filter returns only that inspection's NCs.
    @Test
    void filtersByInspectionId() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").param("inspectionId", globexInspection.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].inspectionId").value(globexInspection.getId().intValue()));
    }

    // h. client filter is case-insensitive.
    @Test
    void filtersByClientCaseInsensitive() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").param("client", "acme co")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].clientName").value("Acme Co"));
    }

    // Pagination respects page/size and Page metadata.
    @Test
    void respectsPagination() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").param("page", "0").param("size", "2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    // i. response exposes createdAt and never updatedAt.
    @Test
    void responseExposesCreatedAtAndNotUpdatedAt() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].createdAt").isNotEmpty())
                .andExpect(jsonPath("$.content[0].updatedAt").doesNotExist());
    }

    @Test
    void rejectsCriticalCreationWithoutEvidenceAndDoesNotPersist() throws Exception {
        long before = nonConformityRepository.count();
        InspectionItemSnapshot item = itemFor(acmeInspection);

        mockMvc.perform(post("/api/v1/non-conformities").header("Authorization", "Bearer " + obtainToken("sup@fieldops.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nonConformityBody(acmeInspection, item, "CRITICAL")))
                .andExpect(status().isBadRequest());

        assertThat(nonConformityRepository.count()).isEqualTo(before);
    }

    @Test
    void createsCriticalNonConformityWhenItemEvidenceExists() throws Exception {
        InspectionItemSnapshot item = itemFor(acmeInspection);
        evidenceRepository.save(InspectionEvidence.create(acmeInspection, item, "acme/photo.jpg", "checksum",
                "Photo", Instant.now(), technician));

        mockMvc.perform(post("/api/v1/non-conformities").header("Authorization", "Bearer " + obtainToken("sup@fieldops.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nonConformityBody(acmeInspection, item, "CRITICAL")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.severity").value("CRITICAL"));
    }

    @Test
    void rejectsCriticalUpdateWithoutEvidenceAndKeepsPreviousSeverity() throws Exception {
        InspectionItemSnapshot item = itemFor(acmeInspection);
        NonConformity existing = nonConformityRepository.save(NonConformity.create(acmeInspection, item,
                "Existing issue", "Details", NonConformitySeverity.HIGH));

        mockMvc.perform(put("/api/v1/non-conformities/{id}", existing.getId())
                        .header("Authorization", "Bearer " + obtainToken("sup@fieldops.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nonConformityBody(acmeInspection, item, "CRITICAL")))
                .andExpect(status().isBadRequest());

        assertThat(nonConformityRepository.findById(existing.getId()).orElseThrow().getSeverity())
                .isEqualTo(NonConformitySeverity.HIGH);
    }

    @Test
    void softDeletesNonConformityAndKeepsItOutOfReadQueries() throws Exception {
        InspectionItemSnapshot item = itemFor(acmeInspection);
        NonConformity existing = nonConformityRepository.save(NonConformity.create(acmeInspection, item,
                "Existing issue", "Details", NonConformitySeverity.HIGH));
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/non-conformities/{id}", existing.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existing.getId()));

        mockMvc.perform(put("/api/v1/non-conformities/{id}", existing.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nonConformityBody(acmeInspection, item, "HIGH")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Critical issue"));

        mockMvc.perform(delete("/api/v1/non-conformities/{id}", existing.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/non-conformities/{id}", existing.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/non-conformities").param("inspectionId", acmeInspection.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id").value(
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(existing.getId().intValue()))));
        mockMvc.perform(get("/api/v1/dashboard/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openNonConformities").value(2));
        mockMvc.perform(get("/api/v1/inspections/{id}/review", acmeInspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nonConformities[*].id").value(
                        org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem(existing.getId().intValue()))));

        java.util.Map<String, Object> stored = jdbcTemplate.queryForMap(
                "SELECT deleted_at, deleted_by FROM non_conformities WHERE id = ?", existing.getId());
        assertThat(stored.get("deleted_at")).isNotNull();
        assertThat(((Number) stored.get("deleted_by")).longValue()).isEqualTo(supervisor.getId());
        assertThat(auditEventRepository.findByEntityTypeAndEntityIdOrderByOccurredAtAscIdAsc(
                "NON_CONFORMITY", existing.getId()))
                .anySatisfy((AuditEvent event) -> {
                    assertThat(event.getAction().name()).isEqualTo("NON_CONFORMITY_DELETED");
                    assertThat(event.getActorId()).isEqualTo(supervisor.getId());
                });
    }

    private InspectionItemSnapshot itemFor(Inspection inspection) {
        return snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst();
    }

    private String nonConformityBody(Inspection inspection, InspectionItemSnapshot item, String severity) {
        return "{\"inspectionId\":" + inspection.getId() + ",\"itemId\":" + item.getSourceTemplateItemId()
                + ",\"title\":\"Critical issue\",\"description\":\"Details\",\"severity\":\""
                + severity + "\",\"status\":\"OPEN\"}";
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
        InspectionTemplate tpl = new InspectionTemplate();
        tpl.setTitle("Compressor inspection");
        tpl.setCategory("MECHANICAL");
        tpl.setVersion(1);
        tpl.setPublished(true);
        tpl.setCreatedBy(creator);
        return templateRepository.save(tpl);
    }

    private Inspection saveInspection(String clientName) {
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection for " + clientName);
        inspection.setTemplate(template);
        inspection.setClientName(clientName);
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Compressor");
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(InspectionStatus.UNDER_REVIEW);
        inspection.setPriority(Priority.MEDIUM);
        inspection.setDueDate(LocalDate.now().plusDays(1));
        TemplateSection section = new TemplateSection();
        section.setTemplate(template);
        section.setTitle("Safety");
        section.setDisplayOrder(1);
        section = sectionRepository.save(section);
        TemplateItem item = new TemplateItem();
        item.setSection(section);
        item.setQuestion("Is the equipment safe?");
        item.setResponseType(ResponseType.BOOLEAN);
        item.setRequired(true);
        item.setDisplayOrder(1);
        item = itemRepository.save(item);
        inspection.addItemSnapshot(InspectionItemSnapshot.from(inspection, section, item));
        return inspectionRepository.save(inspection);
    }

    private void saveNonConformity(
            Inspection inspection, String title, NonConformitySeverity severity, NonConformityStatus status) {
        NonConformity nc = NonConformity.create(inspection, null, title, "desc", severity);
        if (status == NonConformityStatus.CLOSED) {
            ReflectionTestUtils.setField(nc, "status", NonConformityStatus.CLOSED);
            ReflectionTestUtils.setField(nc, "closedAt", Instant.now());
        }
        nonConformityRepository.save(nc);
    }

    private void saveClosedNonConformity(Inspection inspection, String title, NonConformitySeverity severity) {
        saveNonConformity(inspection, title, severity, NonConformityStatus.CLOSED);
    }

    private String obtainToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
