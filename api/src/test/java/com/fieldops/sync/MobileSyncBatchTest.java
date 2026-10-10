package com.fieldops.sync;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionItemSnapshot;
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
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.nonconformity.repository.NonConformityRepository;
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
    private TemplateSectionRepository sectionRepository;

    @Autowired
    private TemplateItemRepository itemRepository;

    @Autowired
    private InspectionItemSnapshotRepository snapshotRepository;

    @Autowired
    private InspectionEvidenceRepository evidenceRepository;

    @Autowired
    private InspectionResponseHistoryRepository answerHistoryRepository;

    @Autowired
    private NonConformityRepository nonConformityRepository;

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
        answerHistoryRepository.deleteAll();
        evidenceRepository.deleteAll();
        nonConformityRepository.deleteAll();
        inspectionRepository.deleteAll();
        itemRepository.deleteAll();
        sectionRepository.deleteAll();
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
                + operation(submitOp, "SUBMITTED", inspection.getId(), 1L, startOp)
                + ","
                + operation(startOp, "IN_PROGRESS", inspection.getId(), 0L, null)
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
        String body = "{\"operations\":[" + operation(startOp, "IN_PROGRESS", inspection.getId(), 0L, null) + "]}";

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
                + operation(submitOp, "SUBMITTED", inspection.getId(), 0L, missingDependency) + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("DEFERRED"));

        // Nothing applied: status unchanged and no processed row.
        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.ASSIGNED);
        assertThat(processedOperationRepository.count()).isZero();
    }

    @Test
    void createsEvidenceMetadataForTheInspectionItem() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        InspectionItemSnapshot item = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(
                inspection.getId()).getFirst();
        UUID operationId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operations\":[" + evidenceOperation(operationId, inspection.getId(),
                                item.getSourceTemplateItemId(), null)
                                + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));

        assertThat(evidenceRepository.findByInspectionIdOrderByCapturedAtAsc(inspection.getId()))
                .singleElement()
                .satisfies(evidence -> {
                    assertThat(evidence.getItemSnapshot().getId()).isEqualTo(item.getId());
                    assertThat(evidence.getReference()).isEqualTo("evidences/photo-1.jpg");
                    assertThat(evidence.getLocation()).isEqualTo("{\"latitude\":-23.5505,\"longitude\":-46.6333}");
                });
    }

    @Test
    void doesNotDuplicateEvidenceWhenOperationIsResent() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
        UUID operationId = UUID.randomUUID();
        String body = "{\"operations\":[" + evidenceOperation(operationId, inspection.getId(), itemId, null) + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));
        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("ALREADY_APPLIED"));

        assertThat(evidenceRepository.count()).isEqualTo(1);
        assertThat(processedOperationRepository.count()).isEqualTo(1);
    }

    @Test
    void defersEvidenceWhenItsAnswerDependencyIsNotResolved() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
        UUID missingAnswer = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operations\":[" + evidenceOperation(UUID.randomUUID(), inspection.getId(), itemId,
                                missingAnswer) + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("DEFERRED"));

        assertThat(evidenceRepository.count()).isZero();
    }

    @Test
    void appliesNewChecklistAnswerToTheSnapshotItem() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operations\":[" + answerOperation(UUID.randomUUID(), inspection.getId(), itemId,
                                "CONFORMING", "Panel is clean") + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));

        assertThat(answerHistoryRepository
                .findByInspectionIdOrderBySectionOrderAscItemOrderAscAnsweredAtAscIdAsc(inspection.getId()))
                .singleElement()
                .satisfies(answer -> {
                    assertThat(answer.getItemId()).isEqualTo(itemId);
                    assertThat(answer.getValue()).isEqualTo("CONFORMING");
                    assertThat(answer.getObservation()).isEqualTo("Panel is clean");
                });
    }

    @Test
    void appendsUpdatedChecklistAnswerAsTheLatestVersion() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
        String body = "{\"operations\":["
                + answerOperation(UUID.randomUUID(), inspection.getId(), itemId, "NON_CONFORMING", "First reading")
                + "," + answerOperation(UUID.randomUUID(), inspection.getId(), itemId, "CONFORMING", "Corrected")
                + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"))
                .andExpect(jsonPath("$.results[1].status").value("APPLIED"));

        assertThat(answerHistoryRepository
                .findByInspectionIdOrderBySectionOrderAscItemOrderAscAnsweredAtAscIdAsc(inspection.getId()))
                .extracting(answer -> answer.getValue())
                .containsExactly("NON_CONFORMING", "CONFORMING");
    }

    @Test
    void doesNotDuplicateChecklistAnswerWhenOperationIsResent() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
        UUID operationId = UUID.randomUUID();
        String body = "{\"operations\":[" + answerOperation(operationId, inspection.getId(), itemId,
                "CONFORMING", null) + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));
        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("ALREADY_APPLIED"));

        assertThat(answerHistoryRepository.count()).isEqualTo(1);
        assertThat(processedOperationRepository.count()).isEqualTo(1);
    }

    @Test
    void reportsInvalidAnswerAsFailedAndContinuesTheBatch() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
        String invalid = "{\"operationId\":\"" + UUID.randomUUID()
                + "\",\"type\":\"ANSWER_UPSERT\",\"dependencyIds\":[],\"baseVersion\":0,\"payload\":{\"inspectionId\":"
                + inspection.getId() + ",\"itemId\":" + itemId + "}}";
        String valid = answerOperation(UUID.randomUUID(), inspection.getId(), itemId, "CONFORMING", null);

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operations\":[" + invalid + "," + valid + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("FAILED"))
                .andExpect(jsonPath("$.results[1].status").value("APPLIED"));

        assertThat(answerHistoryRepository.count()).isEqualTo(1);
    }

    @Test
    void createsNonConformityForTheInspectionItem() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        InspectionItemSnapshot item = snapshotRepository
                .findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId()).getFirst();
        Long itemId = item.getSourceTemplateItemId();

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"operations\":[" + nonConformityOperation(UUID.randomUUID(), inspection.getId(),
                                itemId, null) + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));

        assertThat(nonConformityRepository.findByInspectionIdOrderByCreatedAtAsc(inspection.getId()))
                .singleElement()
                .satisfies(nonConformity -> {
                    assertThat(nonConformity.getInspectionItemSnapshot().getId()).isEqualTo(item.getId());
                    assertThat(nonConformity.getTitle()).isEqualTo("Damaged panel");
                    assertThat(nonConformity.getSeverity().name()).isEqualTo("HIGH");
                    assertThat(nonConformity.getStatus().name()).isEqualTo("OPEN");
                });
    }

    @Test
    void doesNotDuplicateNonConformityWhenOperationIsResent() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.IN_PROGRESS);
        Long itemId = snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
        UUID operationId = UUID.randomUUID();
        String body = "{\"operations\":[" + nonConformityOperation(operationId, inspection.getId(), itemId, null)
                + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("APPLIED"));
        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("ALREADY_APPLIED"));

        assertThat(nonConformityRepository.count()).isEqualTo(1);
        assertThat(processedOperationRepository.count()).isEqualTo(1);
    }

    // --- fixtures ---

    @Test
    void reportsConflictAndPreservesServerStateWhenBaseVersionIsStale() throws Exception {
        Inspection inspection = saveInspection(InspectionStatus.ASSIGNED);
        inspection.setStatus(InspectionStatus.IN_PROGRESS);
        inspectionRepository.saveAndFlush(inspection);

        String body = "{\"operations\":[" + operation(
                UUID.randomUUID(), "SUBMITTED", inspection.getId(), 0L, null) + "]}";

        mockMvc.perform(post("/api/v1/mobile/sync/push").header("Authorization", "Bearer " + obtainToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].status").value("CONFLICT"));

        assertThat(inspectionRepository.findById(inspection.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionStatus.IN_PROGRESS);
        assertThat(processedOperationRepository.count()).isZero();
    }

    private String operation(UUID opId, String status, Long inspectionId, Long baseVersion, UUID dependencyId) {
        String deps = dependencyId == null ? "[]" : "[\"" + dependencyId + "\"]";
        return "{\"operationId\":\"" + opId + "\",\"type\":\"INSPECTION_STATUS\",\"dependencyIds\":" + deps
                + ",\"baseVersion\":" + baseVersion
                + ",\"payload\":{\"inspectionId\":" + inspectionId + ",\"status\":\"" + status + "\"}}";
    }

    private String evidenceOperation(UUID operationId, Long inspectionId, Long itemId, UUID dependencyId) {
        String dependencies = dependencyId == null ? "[]" : "[\"" + dependencyId + "\"]";
        return "{\"operationId\":\"" + operationId + "\",\"type\":\"EVIDENCE_CREATE\",\"dependencyIds\":"
                + dependencies + ",\"baseVersion\":0,\"payload\":{\"inspectionId\":" + inspectionId
                + ",\"itemId\":" + itemId + ",\"fileRef\":\"evidences/photo-1.jpg\",\"capturedAt\":"
                + "\"2026-10-05T12:00:00Z\",\"latitude\":-23.5505,\"longitude\":-46.6333}}";
    }

    private String answerOperation(UUID operationId, Long inspectionId, Long itemId, String value,
            String observation) {
        String optionalObservation = observation == null ? "" : ",\"observation\":\"" + observation + "\"";
        return "{\"operationId\":\"" + operationId + "\",\"type\":\"ANSWER_UPSERT\",\"dependencyIds\":[]"
                + ",\"baseVersion\":0,\"payload\":{\"inspectionId\":" + inspectionId + ",\"itemId\":"
                + itemId + ",\"value\":\"" + value + "\"" + optionalObservation + "}}";
    }

    private String nonConformityOperation(UUID operationId, Long inspectionId, Long itemId, UUID dependencyId) {
        String dependencies = dependencyId == null ? "[]" : "[\"" + dependencyId + "\"]";
        return "{\"operationId\":\"" + operationId + "\",\"type\":\"NON_CONFORMITY_CREATE\",\"dependencyIds\":"
                + dependencies + ",\"baseVersion\":0,\"payload\":{\"inspectionId\":" + inspectionId
                + ",\"itemId\":" + itemId + ",\"title\":\"Damaged panel\",\"description\":"
                + "\"Panel cover is corroded\",\"severity\":\"HIGH\"}}";
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
        TemplateSection section = persistSection();
        TemplateItem item = persistItem(section);
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
        inspection.addItemSnapshot(InspectionItemSnapshot.from(inspection, section, item));
        return inspectionRepository.save(inspection);
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

    private String obtainToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tech@fieldops.com\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
