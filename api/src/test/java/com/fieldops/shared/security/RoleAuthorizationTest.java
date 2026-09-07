package com.fieldops.shared.security;

import com.fieldops.auth.repository.RefreshTokenRepository;
import com.fieldops.inspection.repository.InspectionRepository;
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
import org.springframework.test.web.servlet.ResultMatcher;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the role matrix on protected routes: which profile may call what, and that
 * denials return the shared error body — 401 for a missing session, 403 for the wrong
 * role, never leaking more than the standard error fields.
 *
 * Users are seeded one per profile and authenticate through the real login endpoint so
 * the JWT filter and authority mapping run exactly as in production.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoleAuthorizationTest {

    private static final String PASSWORD = "pass123";

    /** Supervisor-scoped resources: ADMIN + SUPERVISOR may, TECHNICIAN may not. */
    private static final List<String> SUPERVISOR_SCOPED_PATHS = List.of(
            "/api/v1/clients",
            "/api/v1/sites",
            "/api/v1/equipment",
            "/api/v1/inspection-templates",
            "/api/v1/inspections");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void seedOneUserPerRole() {
        // The shared in-memory DB may carry rows from a previous test class. Clear children
        // before users, respecting FK order: inspections and refresh tokens both reference users.
        inspectionRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
        persistUser("admin@fieldops.com", Role.ADMINISTRATOR);
        persistUser("sup@fieldops.com", Role.SUPERVISOR);
        persistUser("tech@fieldops.com", Role.TECHNICIAN);
    }

    @Test
    void returns401WithStandardBodyWhenTokenIsMissing() throws Exception {
        mockMvc.perform(get("/api/v1/clients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    @Test
    void allowsAdministratorAndSupervisorOnSupervisorScopedResources() throws Exception {
        for (String path : SUPERVISOR_SCOPED_PATHS) {
            mockMvc.perform(get(path).header("Authorization", bearer("admin@fieldops.com")))
                    .andExpect(authorizedStatusFor(path));
            mockMvc.perform(get(path).header("Authorization", bearer("sup@fieldops.com")))
                    .andExpect(authorizedStatusFor(path));
        }
    }

    @Test
    void returns403WithSafeBodyWhenTechnicianCallsSupervisorScopedResources() throws Exception {
        for (String path : SUPERVISOR_SCOPED_PATHS) {
            mockMvc.perform(get(path).header("Authorization", bearer("tech@fieldops.com")))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("Access denied"))
                    .andExpect(jsonPath("$.path").value(path))
                    .andExpect(jsonPath("$.fieldErrors").isEmpty())
                    // The body carries exactly the standard error fields — nothing else leaks.
                    .andExpect(jsonPath("$.*", hasSize(6)));
        }
    }

    @Test
    void allowsTechnicianButNotAdministratorOrSupervisorOnMobile() throws Exception {
        mockMvc.perform(get("/api/v1/mobile/inspections")
                        .header("Authorization", bearer("tech@fieldops.com")))
                .andExpect(status().isOk());

        for (String email : List.of("admin@fieldops.com", "sup@fieldops.com")) {
            mockMvc.perform(get("/api/v1/mobile/inspections")
                            .header("Authorization", bearer(email)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }
    }

    @Test
    void allowsAdministratorButForbidsTechnicianOnUserManagement() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", bearer("tech@fieldops.com")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", bearer("admin@fieldops.com")))
                .andExpect(status().isOk());
    }

    /**
     * This test asserts authorization, not business behaviour. An authorized ADMIN/SUPERVISOR
     * request must get past the security layer — the exact outcome then depends on each
     * controller (200 for an implemented list, 400 when a required query param is missing,
     * 404 when no handler exists yet). So "authorized" is verified as: not 401 and not 403.
     */
    private ResultMatcher authorizedStatusFor(String path) {
        return result -> {
            int statusCode = result.getResponse().getStatus();
            if (statusCode == 401 || statusCode == 403) {
                throw new AssertionError(
                        "Expected " + path + " to be authorized for ADMIN/SUPERVISOR, but got " + statusCode);
            }
        };
    }

    private String bearer(String email) throws Exception {
        return "Bearer " + obtainToken(email);
    }

    private String obtainToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private void persistUser(String email, Role role) {
        User user = new User();
        user.setName("User " + email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        userRepository.save(user);
    }
}
