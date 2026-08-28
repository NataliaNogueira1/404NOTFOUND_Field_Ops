package com.fieldops.inspection.controller;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
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

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authenticates with a real Bearer JWT because the endpoint reads the
 * {@code AuthenticatedUser} principal populated by the JWT filter — a mocked
 * user would leave it null.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MobileInspectionControllerTest {

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

    private User technician;

    private User otherTechnician;

    @BeforeEach
    void seedTechnicianWithTwoActionableInspections() {
        inspectionRepository.deleteAll();
        templateRepository.deleteAll();
        // Refresh tokens reference users; clear them first or the FK blocks the cleanup.
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();

        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        otherTechnician = persistUser("other-tech@fieldops.com", Role.TECHNICIAN);
        User supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        InspectionTemplate template = persistTemplate();

        saveInspection(template, technician, supervisor, InspectionStatus.ASSIGNED, Priority.HIGH);
        saveInspection(template, technician, supervisor, InspectionStatus.IN_PROGRESS, Priority.LOW);
        saveInspection(template, otherTechnician, supervisor, InspectionStatus.ASSIGNED, Priority.MEDIUM);
    }

    @Test
    void listsActionableInspectionsForAuthenticatedTechnician() throws Exception {
        String token = obtainToken("tech@fieldops.com", "pass123");

        mockMvc.perform(get("/api/v1/mobile/inspections")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$..status",
                        containsInAnyOrder("ASSIGNED", "IN_PROGRESS")))
                .andExpect(jsonPath("$[0].template.sections", hasSize(1)));
    }

    @Test
    void doesNotListInspectionsAssignedToAnotherTechnician() throws Exception {
        // Three inspections exist, but one belongs to the other technician: each
        // technician must see only their own assignments.
        mockMvc.perform(get("/api/v1/mobile/inspections")
                        .header("Authorization", "Bearer " + obtainToken("tech@fieldops.com", "pass123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$..technicianId",
                        containsInAnyOrder(String.valueOf(technician.getId()),
                                String.valueOf(technician.getId()))));

        mockMvc.perform(get("/api/v1/mobile/inspections")
                        .header("Authorization", "Bearer " + obtainToken("other-tech@fieldops.com", "pass123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].technicianId")
                        .value(String.valueOf(otherTechnician.getId())));
    }

    private User persistUser(String email, Role role) {
        User user = new User();
        user.setName("User " + email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("pass123"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private InspectionTemplate persistTemplate() {
        TemplateItem item = new TemplateItem();
        item.setQuestion("Is the equipment grounded?");
        item.setResponseType(ResponseType.BOOLEAN);
        item.setRequired(true);
        item.setRequireObservationOnFailure(false);
        item.setSortOrder(0);

        TemplateSection section = new TemplateSection();
        section.setTitle("Safety");
        section.setSortOrder(0);
        item.setSection(section);
        section.getItems().add(item);

        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Electrical inspection");
        template.setCategory("ELECTRICAL");
        template.setVersion(1);
        template.setPublished(true);
        section.setTemplate(template);
        template.getSections().add(section);

        return templateRepository.save(template);
    }

    private void saveInspection(InspectionTemplate template, User technician, User supervisor,
                                InspectionStatus status, Priority priority) {
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection " + status);
        inspection.setTemplate(template);
        inspection.setClientName("Acme Co");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Panel A");
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(status);
        inspection.setPriority(priority);
        inspection.setDueDate(LocalDate.now().plusDays(1));
        inspectionRepository.save(inspection);
    }

    private String obtainToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
