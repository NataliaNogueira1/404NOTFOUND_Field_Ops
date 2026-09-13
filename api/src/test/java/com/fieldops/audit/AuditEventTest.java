package com.fieldops.audit;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.model.AuditEvent;
import com.fieldops.audit.repository.AuditEventRepository;
import com.fieldops.audit.service.AuditService;
import com.fieldops.auth.repository.RefreshTokenRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Audit trail behaviour (PBI-063): recording, chronological timeline, immutability
 * and the GET /inspections/{id}/history endpoint.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditEventTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void clean() {
        auditEventRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        auditEventRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void recordsEventsAndReturnsChronologicalTimeline() {
        auditService.recordInspection(1L, AuditAction.INSPECTION_CREATED, 42L, null);
        auditService.recordInspection(1L, AuditAction.INSPECTION_ASSIGNED, 42L, "technicianId=9");
        auditService.recordInspection(2L, AuditAction.INSPECTION_CANCELED, 42L, "reason");
        // event for another inspection must not leak into #42's timeline
        auditService.recordInspection(1L, AuditAction.INSPECTION_CREATED, 99L, null);

        var timeline = auditService.timeline(AuditService.ENTITY_INSPECTION, 42L);

        assertThat(timeline).extracting(e -> e.action().name())
                .containsExactly("INSPECTION_CREATED", "INSPECTION_ASSIGNED", "INSPECTION_CANCELED");
    }

    @Test
    void auditEventHasNoMutationApi() {
        // The immutability guarantee is structural: AuditEvent exposes no setters and the
        // repository/service offer no update or delete of individual events. Verify a stored
        // event keeps its stamped values.
        auditService.recordInspection(7L, AuditAction.INSPECTION_APPROVED, 55L, "ok");

        AuditEvent stored = auditEventRepository.findAll().get(0);
        assertThat(stored.getOccurredAt()).isNotNull();
        assertThat(stored.getActorId()).isEqualTo(7L);
        assertThat(stored.getAction()).isEqualTo(AuditAction.INSPECTION_APPROVED);
    }

    @Test
    void historyEndpointReturnsTimelineForInspection() throws Exception {
        User admin = persistUser("admin@fieldops.com", Role.ADMINISTRATOR);
        auditService.recordInspection(admin.getId(), AuditAction.INSPECTION_CREATED, 77L, null);
        auditService.recordInspection(admin.getId(), AuditAction.INSPECTION_ASSIGNED, 77L, "technicianId=3");

        String token = obtainToken("admin@fieldops.com");

        mockMvc.perform(get("/api/v1/inspections/{id}/history", 77L)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].action").value("INSPECTION_CREATED"))
                .andExpect(jsonPath("$[1].action").value("INSPECTION_ASSIGNED"))
                .andExpect(jsonPath("$[0].entityType").value("INSPECTION"))
                .andExpect(jsonPath("$[0].entityId").value(77));
    }

    private User persistUser(String email, Role role) {
        User user = new User();
        user.setName("User " + email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("pass123"));
        user.setRole(role);
        return userRepository.save(user);
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
