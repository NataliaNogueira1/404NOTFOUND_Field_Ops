package com.fieldops.sync;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionItemSnapshotRepository;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.inspection.repository.TemplateItemRepository;
import com.fieldops.inspection.repository.TemplateSectionRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Incremental pull with opaque monotonic cursor (PBI-053).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MobileSyncPullTest {

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
    private TemplateSectionRepository sectionRepository;

    @Autowired
    private TemplateItemRepository itemRepository;

    @Autowired
    private InspectionItemSnapshotRepository snapshotRepository;

    @Autowired
    private ProcessedOperationRepository processedOperationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User technician;
    private User otherTechnician;
    private User supervisor;
    private InspectionTemplate template;

    @BeforeEach
    void seed() {
        cleanState();
        supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        otherTechnician = persistUser("tech2@fieldops.com", Role.TECHNICIAN);
        template = persistTemplate(supervisor);
    }

    @AfterEach
    void tearDown() {
        cleanState();
    }

    private void cleanState() {
        processedOperationRepository.deleteAll();
        snapshotRepository.deleteAll();
        inspectionRepository.deleteAll();
        itemRepository.deleteAll();
        sectionRepository.deleteAll();
        templateRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void returnsInitialSetOrderedByUpdatedAtAndIdWithNextCursorWhenNoCursorGiven() throws Exception {
        Inspection first = saveInspection(technician, InspectionStatus.ASSIGNED);
        Inspection second = saveInspection(technician, InspectionStatus.ASSIGNED);
        String token = obtainToken("tech@fieldops.com");

        MvcResult result = mockMvc.perform(get("/api/v1/mobile/sync/pull")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(2))
                .andExpect(jsonPath("$.changes[0].inspection.id").value(String.valueOf(first.getId())))
                .andExpect(jsonPath("$.changes[1].inspection.id").value(String.valueOf(second.getId())))
                .andExpect(jsonPath("$.hasMore").value(false))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn();

        // Following the issued cursor returns an empty delta (nothing newer yet).
        String nextCursor = JsonPath.read(result.getResponse().getContentAsString(), "$.nextCursor");
        mockMvc.perform(get("/api/v1/mobile/sync/pull").param("cursor", nextCursor)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(0))
                .andExpect(jsonPath("$.hasMore").value(false))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void returnsOnlyTheDeltaAfterTheGivenCursor() throws Exception {
        saveInspection(technician, InspectionStatus.ASSIGNED);
        String token = obtainToken("tech@fieldops.com");

        MvcResult first = mockMvc.perform(get("/api/v1/mobile/sync/pull")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        String cursor = JsonPath.read(first.getResponse().getContentAsString(), "$.nextCursor");

        Inspection later = saveInspection(technician, InspectionStatus.ASSIGNED);

        mockMvc.perform(get("/api/v1/mobile/sync/pull").param("cursor", cursor)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(1))
                .andExpect(jsonPath("$.changes[0].inspection.id").value(String.valueOf(later.getId())));
    }

    @Test
    void respectsLimitAndChainsCursorUntilDrained() throws Exception {
        for (int i = 0; i < 3; i++) {
            saveInspection(technician, InspectionStatus.ASSIGNED);
        }
        String token = obtainToken("tech@fieldops.com");

        MvcResult page1 = mockMvc.perform(get("/api/v1/mobile/sync/pull").param("limit", "2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(2))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn();
        String cursor = JsonPath.read(page1.getResponse().getContentAsString(), "$.nextCursor");

        MvcResult page2 = mockMvc.perform(get("/api/v1/mobile/sync/pull").param("limit", "2").param("cursor", cursor)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(1))
                .andExpect(jsonPath("$.hasMore").value(false))
                // Last page still carries a resume point (items were delivered); it only
                // becomes null once the delta is empty — asserted next.
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn();
        String lastCursor = JsonPath.read(page2.getResponse().getContentAsString(), "$.nextCursor");

        mockMvc.perform(get("/api/v1/mobile/sync/pull").param("limit", "2").param("cursor", lastCursor)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(0))
                .andExpect(jsonPath("$.hasMore").value(false))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void classifiesTypeFromCurrentStatusForReviewsAndCancellations() throws Exception {
        Inspection inProgress = saveInspection(technician, InspectionStatus.IN_PROGRESS);
        Inspection approved = saveInspection(technician, InspectionStatus.APPROVED);
        Inspection rejected = saveInspection(technician, InspectionStatus.REJECTED);
        Inspection canceled = saveInspection(technician, InspectionStatus.CANCELED);
        String token = obtainToken("tech@fieldops.com");

        MvcResult result = mockMvc.perform(get("/api/v1/mobile/sync/pull")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(4))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(typeOf(body, inProgress.getId())).isEqualTo("INSPECTION");
        assertThat(typeOf(body, approved.getId())).isEqualTo("REVIEW");
        assertThat(typeOf(body, rejected.getId())).isEqualTo("REVIEW");
        assertThat(typeOf(body, canceled.getId())).isEqualTo("CANCELLATION");
    }

    @Test
    void returnsOnlyInspectionsOfTheAuthenticatedTechnician() throws Exception {
        Inspection mine = saveInspection(technician, InspectionStatus.ASSIGNED);
        saveInspection(otherTechnician, InspectionStatus.ASSIGNED);
        String token = obtainToken("tech@fieldops.com");

        mockMvc.perform(get("/api/v1/mobile/sync/pull").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes.length()").value(1))
                .andExpect(jsonPath("$.changes[0].inspection.id").value(String.valueOf(mine.getId())));
    }

    @Test
    void forbidsNonTechnicianProfiles() throws Exception {
        String token = obtainToken("sup@fieldops.com");

        mockMvc.perform(get("/api/v1/mobile/sync/pull").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void returnsStandardErrorForMalformedCursorInsteadOfRaw500() throws Exception {
        String token = obtainToken("tech@fieldops.com");

        mockMvc.perform(get("/api/v1/mobile/sync/pull").param("cursor", "###not-base64###")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_CURSOR"))
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.path").value("/api/v1/mobile/sync/pull"));
    }

    private String typeOf(String body, Long inspectionId) {
        java.util.List<String> types = JsonPath.read(body,
                "$.changes[?(@.inspection.id == '" + inspectionId + "')].type");
        return types.get(0);
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

    private Inspection saveInspection(User owner, InspectionStatus status) {
        TemplateSection section = persistSection();
        TemplateItem item = persistItem(section);
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection " + status);
        inspection.setTemplate(template);
        inspection.setClientName("Acme Co");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Panel A");
        inspection.setTechnician(owner);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(status);
        inspection.setPriority(Priority.MEDIUM);
        inspection.setDueDate(LocalDate.now().plusDays(1));
        inspection.addItemSnapshot(InspectionItemSnapshot.from(inspection, section, item));
        return inspectionRepository.saveAndFlush(inspection);
    }

    private TemplateSection persistSection() {
        TemplateSection section = new TemplateSection();
        section.setTemplate(template);
        section.setTitle("Safety");
        section.setDisplayOrder(1);
        return sectionRepository.save(section);
    }

    private TemplateItem persistItem(TemplateSection section) {
        TemplateItem item = new TemplateItem();
        item.setSection(section);
        item.setQuestion("Is the panel safe?");
        item.setResponseType(ResponseType.BOOLEAN);
        item.setRequired(true);
        item.setDisplayOrder(1);
        return itemRepository.save(item);
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
