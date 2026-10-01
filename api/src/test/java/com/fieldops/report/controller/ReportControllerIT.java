package com.fieldops.report.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import java.time.LocalDate;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportControllerIT {

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
    private Inspection inspection;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("supervisor@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("technician@fieldops.com", Role.TECHNICIAN);
        InspectionTemplate template = persistTemplate();
        inspection = persistInspection(template);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    @Test
    void returnsPdfForSupervisor() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/inspections/{id}/report.pdf", inspection.getId())
                        .header("Authorization", bearerToken("supervisor@fieldops.com")))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentType()).isEqualTo(MediaType.APPLICATION_PDF_VALUE);
        assertThat(result.getResponse().getContentAsByteArray())
                .startsWith("%PDF".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
    }

    @Test
    void returnsForbiddenForTechnician() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/{id}/report.pdf", inspection.getId())
                        .header("Authorization", bearerToken("technician@fieldops.com")))
                .andExpect(status().isForbidden());
    }

    @Test
    void returnsNotFoundForUnknownInspection() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/{id}/report.pdf", Long.MAX_VALUE)
                        .header("Authorization", bearerToken("supervisor@fieldops.com")))
                .andExpect(status().isNotFound());
    }

    private void cleanState() {
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    private User persistUser(String email, Role role) {
        User user = new User();
        user.setName(role + " user");
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("pass123"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private InspectionTemplate persistTemplate() {
        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Safety inspection");
        template.setCategory("SAFETY");
        template.setVersion(1);
        template.setPublished(true);
        template.setCreatedBy(supervisor);
        return templateRepository.save(template);
    }

    private Inspection persistInspection(InspectionTemplate template) {
        Inspection reportInspection = new Inspection();
        reportInspection.setTitle("Safety report");
        reportInspection.setTemplate(template);
        reportInspection.setClientName("Acme");
        reportInspection.setSiteName("Plant 1");
        reportInspection.setEquipmentName("Compressor A");
        reportInspection.setTechnician(technician);
        reportInspection.setSupervisor(supervisor);
        reportInspection.setStatus(InspectionStatus.APPROVED);
        reportInspection.setPriority(Priority.HIGH);
        reportInspection.setDueDate(LocalDate.of(2026, 9, 26));
        return inspectionRepository.save(reportInspection);
    }

    private String bearerToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return "Bearer " + JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
