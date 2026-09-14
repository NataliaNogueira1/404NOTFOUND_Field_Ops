package com.fieldops.inspection.controller;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.repository.AuditEventRepository;
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
 * Integration tests for approve/reject decisions (PBI-060 / PBI-061).
 * Uses a real Bearer JWT so the reviewer (AuthenticatedUser) is recorded.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReviewInspectionControllerTest {

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
}
