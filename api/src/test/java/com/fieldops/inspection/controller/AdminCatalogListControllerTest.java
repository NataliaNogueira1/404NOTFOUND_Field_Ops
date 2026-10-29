package com.fieldops.inspection.controller;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(authorities = "SUPERVISOR")
class AdminCatalogListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InspectionTemplateRepository templateRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void listsTemplatesWithStandardPageTextStatusAndSort() throws Exception {
        persistTemplate("Safety Checklist", "Safety", true);
        persistTemplate("Maintenance Draft", "Maintenance", false);

        mockMvc.perform(get("/api/v1/inspection-templates")
                        .param("name", "safety").param("status", "ACTIVE")
                        .param("page", "0").param("size", "10").param("sort", "title,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Safety Checklist"))
                .andExpect(jsonPath("$.content[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    void listsInspectionsWithOperationalFiltersAndPagination() throws Exception {
        User technician = persistUser("Carlos Technician", Role.TECHNICIAN);
        User supervisor = persistUser("Marina Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistTemplate("Compressor", "Maintenance", true);
        persistInspection(template, technician, supervisor, "Atlas overdue", "Industria Atlas",
                InspectionStatus.ASSIGNED, Priority.HIGH, LocalDate.now().minusDays(1));
        persistInspection(template, technician, supervisor, "Other inspection", "Outro Cliente",
                InspectionStatus.APPROVED, Priority.LOW, LocalDate.now().minusDays(2));

        mockMvc.perform(get("/api/v1/inspections")
                        .param("name", "atlas").param("status", "ASSIGNED")
                        .param("technicianName", "Carlos Technician")
                        .param("clientName", "Industria Atlas").param("priority", "HIGH")
                        .param("overdue", "true").param("page", "0").param("size", "10")
                        .param("sort", "dueDate,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Atlas overdue"))
                .andExpect(jsonPath("$.content[0].technicianName").value("Carlos Technician"))
                .andExpect(jsonPath("$.content[0].overdue").value(true))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    void listsInspectionsWithinAnInclusiveDueDateRange() throws Exception {
        User technician = persistUser("Range Technician", Role.TECHNICIAN);
        User supervisor = persistUser("Range Supervisor", Role.SUPERVISOR);
        InspectionTemplate template = persistTemplate("Range Compressor", "Maintenance", true);
        persistInspection(template, technician, supervisor, "Range start", "Range Client",
                InspectionStatus.ASSIGNED, Priority.MEDIUM, LocalDate.of(2026, 10, 10));
        persistInspection(template, technician, supervisor, "Range middle", "Range Client",
                InspectionStatus.ASSIGNED, Priority.MEDIUM, LocalDate.of(2026, 10, 15));
        persistInspection(template, technician, supervisor, "Range end", "Range Client",
                InspectionStatus.ASSIGNED, Priority.MEDIUM, LocalDate.of(2026, 10, 20));
        persistInspection(template, technician, supervisor, "Range outside", "Range Client",
                InspectionStatus.ASSIGNED, Priority.MEDIUM, LocalDate.of(2026, 10, 21));

        mockMvc.perform(get("/api/v1/inspections")
                        .param("name", "range")
                        .param("from", "2026-10-10")
                        .param("to", "2026-10-20")
                        .param("page", "0").param("size", "10").param("sort", "dueDate,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3))
                .andExpect(jsonPath("$.content[0].title").value("Range start"))
                .andExpect(jsonPath("$.content[1].title").value("Range middle"))
                .andExpect(jsonPath("$.content[2].title").value("Range end"));

        mockMvc.perform(get("/api/v1/inspections")
                        .param("name", "range")
                        .param("from", "2026-10-21")
                        .param("page", "0").param("size", "10").param("sort", "dueDate,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Range outside"));

        mockMvc.perform(get("/api/v1/inspections")
                        .param("name", "range")
                        .param("to", "2026-10-15")
                        .param("page", "0").param("size", "10").param("sort", "dueDate,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Range start"))
                .andExpect(jsonPath("$.content[1].title").value("Range middle"));

        mockMvc.perform(get("/api/v1/inspections")
                        .param("name", "range")
                        .param("page", "0").param("size", "10").param("sort", "dueDate,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(4));
    }

    private InspectionTemplate persistTemplate(String title, String category, boolean published) {
        User creator = userRepository.findByEmail("template.creator@example.com")
                .orElseGet(() -> persistUser("Template Creator", Role.SUPERVISOR));
        InspectionTemplate template = new InspectionTemplate();
        template.setTitle(title);
        template.setCategory(category);
        template.setVersion(1);
        template.setPublished(published);
        template.setCreatedBy(creator);
        return templateRepository.saveAndFlush(template);
    }

    private User persistUser(String name, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(name.toLowerCase().replace(' ', '.') + "@example.com");
        user.setPassword("encoded-password");
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private void persistInspection(InspectionTemplate template, User technician, User supervisor,
            String title, String clientName, InspectionStatus status, Priority priority, LocalDate dueDate) {
        Inspection inspection = new Inspection();
        inspection.setTemplate(template);
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setTitle(title);
        inspection.setClientName(clientName);
        inspection.setSiteName("Matriz");
        inspection.setEquipmentName("Compressor");
        inspection.setStatus(status);
        inspection.setPriority(priority);
        inspection.setDueDate(dueDate);
        inspectionRepository.saveAndFlush(inspection);
    }
}
