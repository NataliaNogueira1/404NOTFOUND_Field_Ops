package com.fieldops.inspection.controller;

import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.InspectionTemplateVersion;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.inspection.repository.InspectionTemplateVersionRepository;
import com.fieldops.inspection.repository.TemplateItemRepository;
import com.fieldops.inspection.repository.TemplateSectionRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
    private InspectionTemplateVersionRepository versionRepository;

    @Autowired
    private TemplateSectionRepository sectionRepository;

    @Autowired
    private TemplateItemRepository itemRepository;

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

    @Test
    void createsSectionAtRequestedDisplayOrderAndReturnsOrderedSections() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        persistSection(template, "Funcionamento", null, 1);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/sections", template.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Seguranca",
                                  "description": "Itens de protecao",
                                  "displayOrder": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Seguranca"))
                .andExpect(jsonPath("$.description").value("Itens de protecao"))
                .andExpect(jsonPath("$.displayOrder").value(1));

        mockMvc.perform(get("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections[0].title").value("Seguranca"))
                .andExpect(jsonPath("$.sections[0].displayOrder").value(1))
                .andExpect(jsonPath("$.sections[1].title").value("Funcionamento"))
                .andExpect(jsonPath("$.sections[1].displayOrder").value(2));
    }

    @Test
    void updatesSectionAndReordersItsSiblings() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        TemplateSection first = persistSection(template, "Primeira", null, 1);
        persistSection(template, "Segunda", null, 2);

        mockMvc.perform(put("/api/v1/inspection-templates/{id}/sections/{sectionId}",
                        template.getId(), first.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Primeira editada",
                                  "description": "Descricao editada",
                                  "displayOrder": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Primeira editada"))
                .andExpect(jsonPath("$.description").value("Descricao editada"))
                .andExpect(jsonPath("$.displayOrder").value(2));

        mockMvc.perform(get("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(jsonPath("$.sections[0].title").value("Segunda"))
                .andExpect(jsonPath("$.sections[1].title").value("Primeira editada"));
    }

    @Test
    void deletesSectionFromDraftAndCompactsDisplayOrder() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        TemplateSection first = persistSection(template, "Primeira", null, 1);
        persistSection(template, "Segunda", null, 2);

        mockMvc.perform(delete("/api/v1/inspection-templates/{id}/sections/{sectionId}",
                        template.getId(), first.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(jsonPath("$.sections.length()").value(1))
                .andExpect(jsonPath("$.sections[0].title").value("Segunda"))
                .andExpect(jsonPath("$.sections[0].displayOrder").value(1));
    }

    @Test
    void rejectsSectionChangesWhenTemplateIsNotDraft() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        template.setStatus(InspectionTemplateStatus.ACTIVE);
        templateRepository.saveAndFlush(template);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/sections", template.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Seguranca","displayOrder":1}
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
    }

    @Test
    void createsSingleChoiceItemLinkedToRequestedSection() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        TemplateSection section = persistSection(template, "Seguranca", null, 1);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/sections/{sectionId}/items",
                        template.getId(), section.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Qual o estado da placa?",
                                  "description": "Verifique fixacao e danos",
                                  "responseType": "SINGLE_CHOICE",
                                  "required": true,
                                  "observationRequiredOnFailure": true,
                                  "evidenceRequiredOnFailure": true,
                                  "optionsJson": ["Legivel", "Danificada"],
                                  "displayOrder": 1
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Qual o estado da placa?"))
                .andExpect(jsonPath("$.responseType").value("SINGLE_CHOICE"))
                .andExpect(jsonPath("$.required").value(true))
                .andExpect(jsonPath("$.observationRequiredOnFailure").value(true))
                .andExpect(jsonPath("$.evidenceRequiredOnFailure").value(true))
                .andExpect(jsonPath("$.optionsJson[0]").value("Legivel"))
                .andExpect(jsonPath("$.optionsJson[1]").value("Danificada"))
                .andExpect(jsonPath("$.displayOrder").value(1));

        TemplateItem saved = itemRepository.findAll().get(0);
        assertThat(saved.getSection().getId()).isEqualTo(section.getId());
        assertThat(saved.getOptionsJson()).isEqualTo("[\"Legivel\",\"Danificada\"]");
        assertThat(saved.isRequired()).isTrue();
        assertThat(saved.isObservationRequiredOnFailure()).isTrue();
        assertThat(saved.isEvidenceRequiredOnFailure()).isTrue();
    }

    @Test
    void rejectsSingleChoiceItemWithFewerThanTwoOptions() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        TemplateSection section = persistSection(template, "Seguranca", null, 1);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/sections/{sectionId}/items",
                        template.getId(), section.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Qual o estado?",
                                  "responseType": "SINGLE_CHOICE",
                                  "required": true,
                                  "optionsJson": ["Legivel"],
                                  "displayOrder": 1
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void reordersItemsAndReturnsThemInDisplayOrder() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        TemplateSection section = persistSection(template, "Seguranca", null, 1);
        TemplateItem first = persistItem(section, "Primeiro item", 1);
        persistItem(section, "Segundo item", 2);

        mockMvc.perform(put("/api/v1/inspection-templates/{id}/sections/{sectionId}/items/{itemId}",
                        template.getId(), section.getId(), first.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Primeiro item",
                                  "responseType": "BOOLEAN",
                                  "required": true,
                                  "optionsJson": null,
                                  "displayOrder": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayOrder").value(2));

        mockMvc.perform(get("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(jsonPath("$.sections[0].items[0].title").value("Segundo item"))
                .andExpect(jsonPath("$.sections[0].items[1].title").value("Primeiro item"));
    }

    @Test
    void publishesImmutableSequentialVersionsAndListsTheirHistory() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        template.setDescription("Primeira descricao");
        TemplateSection section = persistSection(template, "Seguranca", null, 1);
        persistItem(section, "Aterramento conforme?", 1);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/publish", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.publishedBy").value(supervisor.getId()))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        InspectionTemplate published = templateRepository.findById(template.getId()).orElseThrow();
        assertThat(published.getStatus()).isEqualTo(InspectionTemplateStatus.ACTIVE);
        assertThat(published.getCurrentVersion()).isEqualTo(1);
        InspectionTemplateVersion firstVersion = versionRepository.findAll().get(0);
        assertThat(firstVersion.getTitleSnapshot()).isEqualTo("Rascunho");
        assertThat(firstVersion.getDescriptionSnapshot()).isEqualTo("Primeira descricao");

        mockMvc.perform(put("/api/v1/inspection-templates/{id}", template.getId())
                        .with(authentication(authenticationFor(supervisor)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Alterado\",\"category\":\"Eletrica\"}"))
                .andExpect(status().isUnprocessableEntity());

        published.setStatus(InspectionTemplateStatus.DRAFT);
        published.setTitle("Segunda versao");
        templateRepository.saveAndFlush(published);
        mockMvc.perform(post("/api/v1/inspection-templates/{id}/publish", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(2));

        mockMvc.perform(get("/api/v1/inspection-templates/{id}/versions", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].versionNumber").value(1))
                .andExpect(jsonPath("$[0].titleSnapshot").value("Rascunho"))
                .andExpect(jsonPath("$[1].versionNumber").value(2))
                .andExpect(jsonPath("$[1].titleSnapshot").value("Segunda versao"));
    }

    @Test
    void rejectsPublishingAnIncompleteTemplate() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/publish", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(
                        "At least one section is required")));

        assertThat(versionRepository.findAll()).isEmpty();
        assertThat(templateRepository.findById(template.getId()).orElseThrow().getStatus())
                .isEqualTo(InspectionTemplateStatus.DRAFT);
    }

    @Test
    void rejectsPublishingSingleChoiceItemWithoutTwoOptions() throws Exception {
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistDraft(supervisor);
        TemplateSection section = persistSection(template, "Seguranca", null, 1);
        TemplateItem item = persistItem(section, "Estado do equipamento", 1);
        item.setResponseType(com.fieldops.inspection.model.ResponseType.SINGLE_CHOICE);
        item.setOptionsJson("[\"Unica opcao\"]");
        itemRepository.saveAndFlush(item);

        mockMvc.perform(post("/api/v1/inspection-templates/{id}/publish", template.getId())
                        .with(authentication(authenticationFor(supervisor))))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(
                        "requires at least two options")));
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

    private TemplateSection persistSection(InspectionTemplate template, String title, String description,
            int displayOrder) {
        TemplateSection section = new TemplateSection();
        section.setTemplate(template);
        section.setTitle(title);
        section.setDescription(description);
        section.setDisplayOrder(displayOrder);
        TemplateSection saved = sectionRepository.saveAndFlush(section);
        template.getSections().add(saved);
        return saved;
    }

    private TemplateItem persistItem(TemplateSection section, String title, int displayOrder) {
        TemplateItem item = new TemplateItem();
        item.setSection(section);
        item.setQuestion(title);
        item.setResponseType(com.fieldops.inspection.model.ResponseType.BOOLEAN);
        item.setRequired(true);
        item.setDisplayOrder(displayOrder);
        TemplateItem saved = itemRepository.saveAndFlush(item);
        section.getItems().add(saved);
        return saved;
    }
}
