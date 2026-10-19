package com.fieldops.evidence.controller;

import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
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
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.sync.repository.ProcessedOperationRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Multipart evidence (photo) upload endpoint (PBI-221). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EvidenceUploadControllerTest {

    @TempDir
    static Path storageDir;

    @DynamicPropertySource
    static void storageProperties(DynamicPropertyRegistry registry) {
        registry.add("fieldops.storage.evidence-dir", () -> storageDir.toString());
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private InspectionTemplateRepository templateRepository;
    @Autowired private TemplateSectionRepository sectionRepository;
    @Autowired private TemplateItemRepository itemRepository;
    @Autowired private InspectionItemSnapshotRepository snapshotRepository;
    @Autowired private InspectionEvidenceRepository evidenceRepository;
    @Autowired private InspectionResponseHistoryRepository answerHistoryRepository;
    @Autowired private NonConformityRepository nonConformityRepository;
    @Autowired private ProcessedOperationRepository processedOperationRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User technician;
    private InspectionTemplate template;

    @BeforeEach
    void seed() {
        cleanState();
        User supervisor = persistUser("sup@fieldops.com", Role.SUPERVISOR);
        technician = persistUser("tech@fieldops.com", Role.TECHNICIAN);
        persistUser("other@fieldops.com", Role.TECHNICIAN);
        template = persistTemplate(supervisor);
    }

    @AfterEach
    void tearDown() throws IOException {
        cleanState();
        clearStorageDir();
    }

    @Test
    void ownerTechnicianUploadsValidMultipartAndEvidenceIsDownloadable() throws Exception {
        Inspection inspection = saveInspection();
        Long itemId = sourceItemId(inspection);
        byte[] content = {9, 8, 7, 6, 5};

        MvcResult upload = mockMvc.perform(multipart("/api/v1/inspections/{id}/evidence", inspection.getId())
                        .file(new MockMultipartFile("file", "photo.jpg", "image/jpeg", content))
                        .param("itemId", itemId.toString())
                        .param("mimeType", "image/jpeg")
                        .param("description", "Front panel")
                        .param("latitude", "-23.5505")
                        .param("longitude", "-46.6333")
                        .param("capturedAtDevice", "2026-10-05T12:00:00Z")
                        .param("operationId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + tokenFor("tech@fieldops.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.checksum").isNotEmpty())
                .andReturn();

        assertThat(evidenceRepository.findByInspectionIdOrderByCapturedAtAsc(inspection.getId()))
                .singleElement()
                .satisfies(evidence -> {
                    assertThat(evidence.getItemSnapshot().getSourceTemplateItemId()).isEqualTo(itemId);
                    assertThat(evidence.getLocation()).isEqualTo("{\"latitude\":-23.5505,\"longitude\":-46.6333}");
                    assertThat(evidence.getDescription()).isEqualTo("Front panel");
                });

        Long evidenceId = ((Number) JsonPath.read(upload.getResponse().getContentAsString(), "$.id")).longValue();
        byte[] downloaded = mockMvc.perform(get("/api/v1/inspection-evidences/{id}/content", evidenceId)
                        .header("Authorization", "Bearer " + tokenFor("sup@fieldops.com")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(downloaded).isEqualTo(content);
    }

    @Test
    void resendSameOperationIdDoesNotDuplicate() throws Exception {
        Inspection inspection = saveInspection();
        Long itemId = sourceItemId(inspection);
        UUID operationId = UUID.randomUUID();

        String first = performUpload(inspection.getId(), itemId, operationId, "tech@fieldops.com", status().isCreated());
        String second = performUpload(inspection.getId(), itemId, operationId, "tech@fieldops.com", status().isCreated());

        assertThat(JsonPath.read(first, "$.id").toString()).isEqualTo(JsonPath.read(second, "$.id").toString());
        assertThat(JsonPath.<String>read(first, "$.checksum")).isEqualTo(JsonPath.read(second, "$.checksum"));
        assertThat(evidenceRepository.count()).isEqualTo(1);
        assertThat(processedOperationRepository.count()).isEqualTo(1);
        try (Stream<Path> files = Files.list(storageDir)) {
            assertThat(files.filter(Files::isRegularFile).count()).isEqualTo(1);
        }
    }

    @Test
    void technicianNotOwnerGetsBusinessError() throws Exception {
        Inspection inspection = saveInspection();
        Long itemId = sourceItemId(inspection);

        performUpload(inspection.getId(), itemId, UUID.randomUUID(), "other@fieldops.com",
                status().isUnprocessableEntity());

        assertThat(evidenceRepository.count()).isZero();
    }

    @Test
    void nonTechnicianProfileIsForbidden() throws Exception {
        Inspection inspection = saveInspection();
        Long itemId = sourceItemId(inspection);

        performUpload(inspection.getId(), itemId, UUID.randomUUID(), "sup@fieldops.com", status().isForbidden());
    }

    @Test
    void missingFileReturnsStandardError() throws Exception {
        Inspection inspection = saveInspection();
        Long itemId = sourceItemId(inspection);

        mockMvc.perform(multipart("/api/v1/inspections/{id}/evidence", inspection.getId())
                        .param("itemId", itemId.toString())
                        .param("capturedAtDevice", "2026-10-05T12:00:00Z")
                        .param("operationId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + tokenFor("tech@fieldops.com")))
                .andExpect(status().is4xxClientError())
                .andExpect(jsonPath("$.code").isNotEmpty());
    }

    @Test
    void missingItemIdOrCapturedAtReturnsValidationError() throws Exception {
        Inspection inspection = saveInspection();

        mockMvc.perform(multipart("/api/v1/inspections/{id}/evidence", inspection.getId())
                        .file(new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] {1, 2}))
                        .param("capturedAtDevice", "2026-10-05T12:00:00Z")
                        .param("operationId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + tokenFor("tech@fieldops.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void latitudeWithoutLongitudeIsBusinessError() throws Exception {
        Inspection inspection = saveInspection();
        Long itemId = sourceItemId(inspection);

        mockMvc.perform(multipart("/api/v1/inspections/{id}/evidence", inspection.getId())
                        .file(new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] {1, 2}))
                        .param("itemId", itemId.toString())
                        .param("latitude", "-23.5505")
                        .param("capturedAtDevice", "2026-10-05T12:00:00Z")
                        .param("operationId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + tokenFor("tech@fieldops.com")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").isNotEmpty());
    }

    @Test
    void nonexistentInspectionReturns404() throws Exception {
        performUpload(999999L, 1L, UUID.randomUUID(), "tech@fieldops.com", status().isNotFound());
    }

    @Test
    void nonexistentItemReturns404() throws Exception {
        Inspection inspection = saveInspection();

        performUpload(inspection.getId(), 888888L, UUID.randomUUID(), "tech@fieldops.com", status().isNotFound());
    }

    private String performUpload(Long inspectionId, Long itemId, UUID operationId, String email,
            org.springframework.test.web.servlet.ResultMatcher expectedStatus) throws Exception {
        return mockMvc.perform(multipart("/api/v1/inspections/{id}/evidence", inspectionId)
                        .file(new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] {4, 5, 6}))
                        .param("itemId", itemId.toString())
                        .param("mimeType", "image/jpeg")
                        .param("capturedAtDevice", "2026-10-05T12:00:00Z")
                        .param("operationId", operationId.toString())
                        .header("Authorization", "Bearer " + tokenFor(email)))
                .andExpect(expectedStatus)
                .andReturn().getResponse().getContentAsString();
    }

    private Long sourceItemId(Inspection inspection) {
        return snapshotRepository.findByInspectionIdOrderBySectionOrderAscItemOrderAsc(inspection.getId())
                .getFirst().getSourceTemplateItemId();
    }

    private void clearStorageDir() throws IOException {
        if (!Files.exists(storageDir)) return;
        try (Stream<Path> files = Files.list(storageDir)) {
            files.filter(Files::isRegularFile).forEach(path -> {
                try {
                    Files.delete(path);
                } catch (IOException ignored) {
                    // best-effort cleanup between tests
                }
            });
        }
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

    private Inspection saveInspection() {
        TemplateSection section = persistSection();
        TemplateItem item = persistItem(section);
        Inspection inspection = new Inspection();
        inspection.setTitle("Inspection");
        inspection.setTemplate(template);
        inspection.setClientName("Acme Co");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Panel A");
        inspection.setTechnician(technician);
        inspection.setSupervisor(technician);
        inspection.setStatus(InspectionStatus.IN_PROGRESS);
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

    private String tokenFor(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }
}
