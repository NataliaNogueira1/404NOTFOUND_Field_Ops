package com.fieldops.inspection.controller;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for POST /api/v1/inspections/{id}/cancel (PBI-029).
 * Uses a real Bearer JWT so the AuthenticatedUser principal is populated (the endpoint
 * records the acting user as canceledBy).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CancelInspectionControllerTest {

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
        // This class is not @Transactional (the login flow needs committed users), so clean up
        // after each test to avoid leaking committed rows into later test classes.
        cleanState();
    }

    private void cleanState() {
        // FK order: inspections -> templates -> refresh tokens -> users.
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void cancelsAssignedInspectionAndRecordsAudit() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(post("/api/v1/inspections/{id}/cancel", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Equipamento descomissionado, nao sera mais inspecionado.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"))
                .andExpect(jsonPath("$.canceledAt").isNotEmpty())
                .andExpect(jsonPath("$.canceledBy").value(supervisor.getId().toString()))
                .andExpect(jsonPath("$.canceledReason")
                        .value("Equipamento descomissionado, nao sera mais inspecionado."));

        Inspection reloaded = inspectionRepository.findById(inspection.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(InspectionStatus.CANCELED);
        assertThat(reloaded.getCanceledAt()).isNotNull();
        assertThat(reloaded.getCanceledBy().getId()).isEqualTo(supervisor.getId());
        assertThat(reloaded.getCanceledReason()).isNotBlank();
    }

    @Test
    void cancelsInProgressAndRejectedInspections() throws Exception {
        String token = obtainToken("sup@fieldops.com");
        for (InspectionStatus status : new InspectionStatus[]{
                InspectionStatus.IN_PROGRESS, InspectionStatus.SUBMITTED,
                InspectionStatus.UNDER_REVIEW, InspectionStatus.REJECTED}) {
            Inspection inspection = saveInspection(status);
            mockMvc.perform(post("/api/v1/inspections/{id}/cancel", inspection.getId())
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Cancelamento administrativo justificado.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELED"));
        }
    }

    @Test
    void rejectsCancellationOfApprovedInspectionWith422() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.APPROVED);
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(post("/api/v1/inspections/{id}/cancel", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Tentativa de cancelar aprovada.\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.APPROVED);
    }

    @Test
    void rejectsReasonShorterThanTenChars() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(post("/api/v1/inspections/{id}/cancel", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"curto\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void returnsNotFoundForUnknownInspection() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(post("/api/v1/inspections/{id}/cancel", Long.MAX_VALUE)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Motivo suficientemente longo.\"}"))
                .andExpect(status().isNotFound());
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

    private String obtainToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
