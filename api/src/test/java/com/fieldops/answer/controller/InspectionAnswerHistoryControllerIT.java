package com.fieldops.answer.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.answer.repository.InspectionAnswerRepository;
import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InspectionAnswerHistoryControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InspectionAnswerRepository inspectionAnswerRepository;

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

    private User supervisor;
    private User technician;
    private Inspection inspection;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("supervisor@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("technician@fieldops.com", Role.TECHNICIAN);
        inspection = persistInspection(persistTemplate());
        InspectionItemSnapshot snapshot = persistSnapshot(inspection);
        inspectionAnswerRepository.save(InspectionAnswer.create(inspection, snapshot,
                "PASS", "No damage found", technician));
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    @Test
    void returnsDetailedHistoryForSupervisor() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", bearerToken("supervisor@fieldops.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].section").value("Electrical safety"))
                .andExpect(jsonPath("$[0].item").value("Cables intact?"))
                .andExpect(jsonPath("$[0].value").value("PASS"))
                .andExpect(jsonPath("$[0].observation").value("No damage found"))
                .andExpect(jsonPath("$[0].answeredAt").isNotEmpty())
                .andExpect(jsonPath("$[0].answeredBy").value("TECHNICIAN user"));
    }

    @Test
    void returnsForbiddenForTechnician() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", inspection.getId())
                        .header("Authorization", bearerToken("technician@fieldops.com")))
                .andExpect(status().isForbidden());
    }

    @Test
    void returnsNotFoundForUnknownInspection() throws Exception {
        mockMvc.perform(get("/api/v1/inspections/{id}/answers/history", Long.MAX_VALUE)
                        .header("Authorization", bearerToken("supervisor@fieldops.com")))
                .andExpect(status().isNotFound());
    }

    private void cleanState() {
        inspectionAnswerRepository.deleteAll();
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
        Inspection answerInspection = new Inspection();
        answerInspection.setTitle("Safety inspection");
        answerInspection.setTemplate(template);
        answerInspection.setClientName("Acme");
        answerInspection.setSiteName("Plant 1");
        answerInspection.setEquipmentName("Compressor A");
        answerInspection.setTechnician(technician);
        answerInspection.setSupervisor(supervisor);
        answerInspection.setStatus(InspectionStatus.SUBMITTED);
        answerInspection.setPriority(Priority.HIGH);
        answerInspection.setDueDate(LocalDate.of(2026, 9, 26));
        return inspectionRepository.save(answerInspection);
    }

    private InspectionItemSnapshot persistSnapshot(Inspection answerInspection) {
        TemplateSection section = new TemplateSection();
        section.setTitle("Electrical safety");
        section.setDisplayOrder(1);
        TemplateItem item = new TemplateItem();
        ReflectionTestUtils.setField(item, "id", 44L);
        item.setQuestion("Cables intact?");
        item.setResponseType(ResponseType.SINGLE_CHOICE);
        item.setRequired(true);
        item.setDisplayOrder(1);
        InspectionItemSnapshot snapshot = InspectionItemSnapshot.from(answerInspection, section, item);
        answerInspection.addItemSnapshot(snapshot);
        return inspectionRepository.save(answerInspection).getItemSnapshots().get(0);
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
