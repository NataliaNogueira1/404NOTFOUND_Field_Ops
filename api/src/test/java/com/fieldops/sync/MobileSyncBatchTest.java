package com.fieldops.sync;

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
 * Batch sync push (PBI-051): dependency ordering, idempotency and deferral.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MobileSyncBatchTest {

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
    void appliesBatchInDependencyOrderAndReportsPerOperation() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken();
        UUID startOp = UUID.randomUUID();   // ASSIGNED -> IN_PROGRESS
        UUID submitOp = UUID.randomUUID();  // IN_PROGRESS -> SUBMITTED, depends on startOp

        // Submitted out of order (submit before start) to prove the server orders by dependency.
        String body = "{\"operations\":["
                + operation(submitOp, "SUBMITTED", inspection.getId(), startOp)
                + ","
                + operation(startOp, "IN_PROGRESS", inspection.getId(), null)
                + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                // results echoed in submission order: submit first, start second
                .andExpect(jsonPath("$.results[0].operationId").value(submitOp.toString()))
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"))
                .andExpect(jsonPath("$.results[1].operationId").value(startOp.toString()))
                .andExpect(jsonPath("$.results[1].status").value("APPLIED"));

        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.SUBMITTED);
        assertThat(processedOperationRepository.count()).isEqualTo(2);
    }

    @Test
    void resendOfSameBatchIsIdempotent() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken();
        UUID startOp = UUID.randomUUID();
        String body = "{\"operations\":[" + operation(startOp, "IN_PROGRESS", inspection.getId(), null) + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));

        // Resend: same operationId -> ALREADY_APPLIED, no duplicate.
        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("ALREADY_APPLIED"));

        assertThat(processedOperationRepository.count()).isEqualTo(1);
    }

    @Test
    void defersOperationWhenDependencyIsNotInBatchNorProcessed() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        String token = obtainToken();
        UUID submitOp = UUID.randomUUID();
        UUID missingDependency = UUID.randomUUID(); // never submitted / never processed

        String body = "{\"operations\":["
                + operation(submitOp, "SUBMITTED", inspection.getId(), missingDependency) + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("DEFERRED"));

        // Nothing applied: status unchanged and no processed row.
        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.ASSIGNED);
        assertThat(processedOperationRepository.count()).isZero();
    }

    // --- fixtures ---

    private String operation(UUID opId, String status, Long inspectionId, UUID dependencyId) {
        String deps = dependencyId == null ? "[]" : "[\"" + dependencyId + "\"]";
        return "{\"operationId\":\"" + opId + "\",\"type\":\"INSPECTION_STATUS\",\"dependencyIds\":" + deps
                + ",\"payload\":{\"inspectionId\":" + inspectionId + ",\"status\":\"" + status + "\"}}";
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
        inspection.setSupervisor(technician);
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
