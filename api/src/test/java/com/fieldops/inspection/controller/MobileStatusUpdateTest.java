package com.fieldops.inspection.controller;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.sync.repository.ProcessedOperationRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Idempotent mobile status transitions (PBI-052 / #72).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MobileStatusUpdateTest {

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
    private ProcessedOperationRepository processedOperationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User technician;
    private InspectionTemplate template;

    @BeforeEach
    void seed() {
        cleanState();
        User supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        template = persistTemplate(supervisor);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    private void cleanState() {
        processedOperationRepository.deleteAll();
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void appliesTransitionAndIsIdempotentOnResend() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken();
        String operationId = UUID.randomUUID().toString();
        String body = "{\"operationId\":\"" + operationId + "\",\"status\":\"IN_PROGRESS\"}";

        // First send: applied.
        mockMvc.perform(post("/api/v1/mobile/inspections/{id}/status", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.result").value("APPLIED"))
                .andExpect(jsonPath("$.applied").value(true));

        // Resend with same operationId: no double apply, ALREADY_APPLIED.
        mockMvc.perform(post("/api/v1/mobile/inspections/{id}/status", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("ALREADY_APPLIED"))
                .andExpect(jsonPath("$.applied").value(false))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        assertThat(processedOperationRepository.count()).isEqualTo(1);
        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.IN_PROGRESS);
    }

    @Test
    void rejectsIllegalTransitionWith422() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken();
        String body = "{\"operationId\":\"" + UUID.randomUUID() + "\",\"status\":\"APPROVED\"}";

        mockMvc.perform(post("/api/v1/mobile/inspections/{id}/status", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        assertThat(processedOperationRepository.count()).isZero();
    }

    @Test
    void rejectsTransitionForInspectionOfAnotherTechnicianWith422() throws Exception {
        User otherTech = persistUser("other@fieldops.com", Role.TECHNICIAN);
        Inspection inspection = saveInspectionFor(otherTech, InspectionStatus.ASSIGNED);
        String token = obtainToken();
        String body = "{\"operationId\":\"" + UUID.randomUUID() + "\",\"status\":\"IN_PROGRESS\"}";

        mockMvc.perform(post("/api/v1/mobile/inspections/{id}/status", inspection.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity());
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
        return saveInspectionFor(technician, status);
    }

    private Inspection saveInspectionFor(User tech, InspectionStatus status) {
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection " + status);
        inspection.setTemplate(template);
        inspection.setClientName("Acme Co");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Panel A");
        inspection.setTechnician(tech);
        inspection.setSupervisor(tech);
        inspection.setStatus(status);
        inspection.setPriority(Priority.MEDIUM);
        inspection.setDueDate(LocalDate.now().plusDays(1));
        return inspectionRepository.save(inspection);
    }

    private String obtainToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tech@fieldops.com\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
