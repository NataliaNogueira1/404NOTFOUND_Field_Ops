package com.fieldops.audit;

import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.audit.service.InspectionAnswerHistoryService;
import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the detailed answer-history endpoint
 * {@code GET /api/v1/inspections/{id}/answers/history} (PBI-088).
 *
 * Covers authorization (ADMINISTRATOR/SUPERVISOR allowed, TECHNICIAN denied), 404 for unknown
 * inspection, empty history, the answer contract fields, deterministic ordering, and multiple
 * versions of the same item preserved chronologically.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InspectionAnswerHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InspectionAnswerHistoryService answerHistoryService;

    @Autowired
    private InspectionResponseHistoryRepository historyRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private InspectionTemplateRepository templateRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User supervisor;
    private User admin;
    private User technician;
    private InspectionTemplate template;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        admin = persistUser("admin@fieldops.com", Role.ADMINISTRATOR);
        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        template = persistTemplate(supervisor);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    private void cleanState() {
        historyRepository.deleteAll();
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // 1. ADMIN can access the endpoint.
    @Test
    void administratorCanAccessHistory() throws Exception {
        Inspection inspection = saveInspection();
        seedSingleAnswer(inspection.getId());
        String token = obtainToken("admin@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    // 2. SUPERVISOR can access the endpoint.
    @Test
    void supervisorCanAccessHistory() throws Exception {
        Inspection inspection = saveInspection();
        seedSingleAnswer(inspection.getId());
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    // 3. A user without permission (TECHNICIAN) is denied (403).
    @Test
    void technicianIsForbidden() throws Exception {
        Inspection inspection = saveInspection();
        String token = obtainToken("tech@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // 4. Unknown inspection returns 404.
    @Test
    void unknownInspectionReturnsNotFound() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    // 5 + 6. Existing inspection returns history with all contract fields.
    @Test
    void returnsHistoryWithContractFields() throws Exception {
        Inspection inspection = saveInspection();
        answerHistoryService.record(inspection.getId(), 10L, "Seguranca", 1, "Botao de emergencia", 2,
                ResponseType.CONFORMITY, "CONFORMING", "Sem anomalias.", technician.getId(),
                Instant.parse("2026-09-22T14:32:00Z"));
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].itemId").value("10"))
                .andExpect(jsonPath("$[0].section").value("Seguranca"))
                .andExpect(jsonPath("$[0].value").value("CONFORMING"))
                .andExpect(jsonPath("$[0].observation").value("Sem anomalias."))
                .andExpect(jsonPath("$[0].answeredAt").isNotEmpty())
                .andExpect(jsonPath("$[0].answeredBy").value(technician.getName()));
    }

    // 7. Deterministic ordering: section -> item -> time.
    @Test
    void ordersBySectionThenItemThenTime() throws Exception {
        Inspection inspection = saveInspection();
        // Insert intentionally out of order.
        answerHistoryService.record(inspection.getId(), 30L, "Operacao", 2, "Pressao", 1,
                ResponseType.NUMBER, "7.5", null, technician.getId(), Instant.parse("2026-09-22T10:00:00Z"));
        answerHistoryService.record(inspection.getId(), 20L, "Condicoes", 1, "Nivel de oleo", 2,
                ResponseType.BOOLEAN, "true", null, technician.getId(), Instant.parse("2026-09-22T10:00:00Z"));
        answerHistoryService.record(inspection.getId(), 10L, "Condicoes", 1, "Carcaca", 1,
                ResponseType.CONFORMITY, "CONFORMING", null, technician.getId(), Instant.parse("2026-09-22T10:00:00Z"));
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                // Section order 1 first (Condicoes), then item order 1 (Carcaca) before item order 2.
                .andExpect(jsonPath("$[0].itemId").value("10"))
                .andExpect(jsonPath("$[1].itemId").value("20"))
                .andExpect(jsonPath("$[2].itemId").value("30"));
    }

    // 8. Multiple versions of the same item appear chronologically.
    @Test
    void multipleVersionsOfSameItemAppearChronologically() throws Exception {
        Inspection inspection = saveInspection();
        Instant base = Instant.parse("2026-09-22T08:00:00Z");
        answerHistoryService.record(inspection.getId(), 10L, "Condicoes", 1, "Carcaca", 1,
                ResponseType.CONFORMITY, "CONFORMING", "v1", technician.getId(), base);
        answerHistoryService.record(inspection.getId(), 10L, "Condicoes", 1, "Carcaca", 1,
                ResponseType.CONFORMITY, "NON_CONFORMING", "v2", technician.getId(), base.plus(1, ChronoUnit.HOURS));
        answerHistoryService.record(inspection.getId(), 10L, "Condicoes", 1, "Carcaca", 1,
                ResponseType.CONFORMITY, "CONFORMING", "v3", technician.getId(), base.plus(2, ChronoUnit.HOURS));
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].value").value("CONFORMING"))
                .andExpect(jsonPath("$[0].observation").value("v1"))
                .andExpect(jsonPath("$[1].value").value("NON_CONFORMING"))
                .andExpect(jsonPath("$[1].observation").value("v2"))
                .andExpect(jsonPath("$[2].value").value("CONFORMING"))
                .andExpect(jsonPath("$[2].observation").value("v3"));
    }

    // 9. Empty history returns an empty list (not a 404).
    @Test
    void emptyHistoryReturnsEmptyList() throws Exception {
        Inspection inspection = saveInspection();
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // 10. Unauthenticated request follows the API error pattern (401).
    @Test
    void unauthenticatedReturns401() throws Exception {
        Inspection inspection = saveInspection();

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId()))
                .andExpect(status().isUnauthorized());
    }

    // 6b. Observation null is preserved as null, value type is not altered (NUMBER kept verbatim).
    @Test
    void preservesNullObservationAndRawValue() throws Exception {
        Inspection inspection = saveInspection();
        answerHistoryService.record(inspection.getId(), 30L, "Operacao", 2, "Pressao", 1,
                ResponseType.NUMBER, "42.5", null, technician.getId(), Instant.parse("2026-09-22T10:00:00Z"));
        String token = obtainToken("admin@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].value").value("42.5"))
                .andExpect(jsonPath("$[0].responseType").value("NUMBER"))
                .andExpect(jsonPath("$[0].observation").doesNotExist());
    }

    // --- fixtures ---

    private void seedSingleAnswer(Long inspectionId) {
        answerHistoryService.record(inspectionId, 1L, "Condicoes", 1, "Carcaca", 1,
                ResponseType.CONFORMITY, "CONFORMING", null, technician.getId(), Instant.now());
    }

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

    private Inspection saveInspection() {
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection with answers");
        inspection.setTemplate(template);
        inspection.setClientName("Acme Co");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Compressor");
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(InspectionStatus.UNDER_REVIEW);
        inspection.setPriority(Priority.MEDIUM);
        inspection.setDueDate(LocalDate.now().plusDays(1));
        return inspectionRepository.save(inspection);
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
