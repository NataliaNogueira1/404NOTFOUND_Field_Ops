package com.fieldops.inspection.controller;

import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.shared.security.AuthenticatedUser;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InspectionTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InspectionTemplateRepository templateRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void createsDraftForAuthenticatedUser() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);

        mockMvc.perform(post("/api/v1/inspection-templates")
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Inspecao Preventiva de Compressor",
                                  "description": "Checklist mensal",
                                  "category": "Manutencao Preventiva"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern(
                        ".*/api/v1/inspection-templates/\\d+")))
                .andExpect(jsonPath("$.title").value("Inspecao Preventiva de Compressor"))
                .andExpect(jsonPath("$.description").value("Checklist mensal"))
                .andExpect(jsonPath("$.category").value("Manutencao Preventiva"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.currentVersion").value(0))
                .andExpect(jsonPath("$.createdBy").value(supervisor.getId()));

        InspectionTemplate saved = templateRepository.findAll().get(0);
        assertThat(saved.getCreatedBy().getId()).isEqualTo(supervisor.getId());
        assertThat(saved.getStatus()).isEqualTo(InspectionTemplateStatus.DRAFT);
    }

    @Test
    void rejectsCreationWithoutRequiredFields() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);

        mockMvc.perform(post("/api/v1/inspection-templates")
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"category\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(2));
    }

    @Test
    void updatesDraftMetadata() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);

        mockMvc.perform(put("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Novo titulo",
                                  "description": "Nova descricao",
                                  "category": "Seguranca"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Novo titulo"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void getsDraftForTheBuilder() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);

        mockMvc.perform(get("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(template.getId()))
                .andExpect(jsonPath("$.title").value("Rascunho"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    private UsernamePasswordAuthenticationToken authenticationFor(User user) {
        AuthenticatedUser principal = new AuthenticatedUser(user);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private User persistUser(String name, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(name.toLowerCase().replace(' ', '.') + "@example.com");
        user.setPassword("encoded-password");
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private InspectionTemplate persistDraft(User creator) {
        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Rascunho");
        template.setCategory("Eletrica");
        template.setStatus(InspectionTemplateStatus.DRAFT);
        template.setCurrentVersion(0);
        template.setCreatedBy(creator);
        return templateRepository.saveAndFlush(template);
    }
}
