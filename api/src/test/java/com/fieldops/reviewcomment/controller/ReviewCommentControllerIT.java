package com.fieldops.reviewcomment.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.repository.AuditEventRepository;
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
import com.fieldops.reviewcomment.repository.ReviewCommentRepository;
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
class ReviewCommentControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReviewCommentRepository reviewCommentRepository;

    @Autowired
    private AuditEventRepository auditEventRepository;

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
    private InspectionItemSnapshot snapshot;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("supervisor@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("technician@fieldops.com", Role.TECHNICIAN);
        inspection = persistInspection(persistTemplate());
        snapshot = persistSnapshot(inspection);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    @Test
    void supervisorCreatesListsAndAuditsReviewComment() throws Exception {
        String token = bearerToken("supervisor@fieldops.com");
        String body = "{\"comment\":\"Repeat the measurement with a calibrated device.\"}";

        mockMvc.perform(post("/api/v1/inspections/{id}/items/{itemId}/review-comment",
                        inspection.getId(), snapshot.getId())
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(snapshot.getId()))
                .andExpect(jsonPath("$.comment").value("Repeat the measurement with a calibrated device."));

        mockMvc.perform(get("/api/v1/inspections/{id}/review-comments", inspection.getId())
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].section").value("Electrical safety"))
                .andExpect(jsonPath("$[0].item").value("Cables intact?"));

        assertThat(auditEventRepository.findAll()).anySatisfy(event -> {
            assertThat(event.getAction()).isEqualTo(AuditAction.REVIEW_COMMENT_ADDED);
            assertThat(event.getEntityId()).isEqualTo(inspection.getId());
            assertThat(event.getActorId()).isEqualTo(supervisor.getId());
        });
    }

    @Test
    void refusesReviewCommentCreationForTechnician() throws Exception {
        mockMvc.perform(post("/api/v1/inspections/{id}/items/{itemId}/review-comment",
                        inspection.getId(), snapshot.getId())
                        .header("Authorization", bearerToken("technician@fieldops.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Repeat the measurement.\"}"))
                .andExpect(status().isForbidden());
    }

    private void cleanState() {
        reviewCommentRepository.deleteAll();
        auditEventRepository.deleteAll();
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
        Inspection reviewInspection = new Inspection();
        reviewInspection.setTitle("Safety inspection");
        reviewInspection.setTemplate(template);
        reviewInspection.setClientName("Acme");
        reviewInspection.setSiteName("Plant 1");
        reviewInspection.setEquipmentName("Compressor A");
        reviewInspection.setTechnician(technician);
        reviewInspection.setSupervisor(supervisor);
        reviewInspection.setStatus(InspectionStatus.UNDER_REVIEW);
        reviewInspection.setPriority(Priority.HIGH);
        reviewInspection.setDueDate(LocalDate.of(2026, 9, 26));
        return inspectionRepository.save(reviewInspection);
    }

    private InspectionItemSnapshot persistSnapshot(Inspection reviewInspection) {
        TemplateSection section = new TemplateSection();
        section.setTitle("Electrical safety");
        section.setDisplayOrder(1);
        TemplateItem item = new TemplateItem();
        ReflectionTestUtils.setField(item, "id", 44L);
        item.setQuestion("Cables intact?");
        item.setResponseType(ResponseType.SINGLE_CHOICE);
        item.setRequired(true);
        item.setDisplayOrder(1);
        InspectionItemSnapshot itemSnapshot = InspectionItemSnapshot.from(reviewInspection, section, item);
        reviewInspection.addItemSnapshot(itemSnapshot);
        return inspectionRepository.save(reviewInspection).getItemSnapshots().get(0);
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
