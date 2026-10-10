package com.fieldops.inspection.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.client.model.Client;
import com.fieldops.client.repository.ClientRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InspectionExportControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private InspectionTemplateRepository templateRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User administrator;
    private User supervisor;
    private User technician;
    private Client client;
    private InspectionTemplate template;

    @BeforeEach
    void seed() {
        cleanState();
        administrator = persistUser("admin@fieldops.com", Role.ADMINISTRATOR);
        supervisor = persistUser("supervisor@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("technician@fieldops.com", Role.TECHNICIAN);
        client = persistClient("Acme, Inc.");
        template = persistTemplate();
        persistInspection("Approved export", InspectionStatus.APPROVED, LocalDate.of(2026, 9, 20));
        persistInspection("Outside period", InspectionStatus.APPROVED, LocalDate.of(2026, 10, 1));
        persistInspection("Different status", InspectionStatus.REJECTED, LocalDate.of(2026, 9, 20));
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    @Test
    void exportsOnlyInspectionsMatchingStatusPeriodAndClient() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/inspections/export.csv")
                        .param("status", "APPROVED")
                        .param("from", "2026-09-01")
                        .param("to", "2026-09-30")
                        .param("clientId", client.getId().toString())
                        .header("Authorization", bearerToken("admin@fieldops.com")))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(result.getResponse().getContentType()).isEqualTo("text/csv;charset=UTF-8");
        assertThat(csv).startsWith("\uFEFFid,title,client,site,equipment,technician,status,priority,");
        assertThat(csv).contains("\"Approved export\"");
        assertThat(csv).doesNotContain("Outside period");
        assertThat(csv).doesNotContain("Different status");
    }

    @Test
    void returnsHeaderOnlyWhenTheFilterMatchesNoInspections() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/inspections/export.csv")
                        .param("status", "CANCELED")
                        .header("Authorization", bearerToken("admin@fieldops.com")))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8))
                .isEqualTo("\uFEFFid,title,client,site,equipment,technician,status,priority,"
                        + "dueDate,createdAt,completedAt,nonConformities\r\n");
    }

    @Test
    void refusesExportForSupervisor() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/export.csv")
                        .header("Authorization", bearerToken("supervisor@fieldops.com")))
                .andExpect(status().isForbidden());
    }

    private void cleanState() {
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        clientRepository.deleteAll();
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

    private Client persistClient(String name) {
        Client exportClient = new Client();
        exportClient.setName(name);
        exportClient.setDocument("12345678000190");
        return clientRepository.save(exportClient);
    }

    private InspectionTemplate persistTemplate() {
        InspectionTemplate inspectionTemplate = new InspectionTemplate();
        inspectionTemplate.setTitle("Safety inspection");
        inspectionTemplate.setCategory("SAFETY");
        inspectionTemplate.setVersion(1);
        inspectionTemplate.setPublished(true);
        inspectionTemplate.setCreatedBy(supervisor);
        return templateRepository.save(inspectionTemplate);
    }

    private void persistInspection(String title, InspectionStatus status, LocalDate dueDate) {
        Inspection inspection = new Inspection();
        inspection.setTitle(title);
        inspection.setTemplate(template);
        inspection.setClientName(client.getName());
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Compressor A");
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(status);
        inspection.setPriority(Priority.HIGH);
        inspection.setDueDate(dueDate);
        inspectionRepository.save(inspection);
    }

    private String bearerToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return "Bearer " + JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
