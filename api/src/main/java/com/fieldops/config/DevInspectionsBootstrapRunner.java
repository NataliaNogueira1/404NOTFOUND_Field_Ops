package com.fieldops.config;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Seeds a published template and a couple of inspections for the local {@code dev} profile so the
 * mobile technician has something to sync and review. Runs after {@link DevUsersBootstrapRunner}
 * (higher {@link Order} value) so the seeded technician/supervisor already exist.
 *
 * <p>Idempotent: skips entirely once any inspection exists. Never loads outside the dev profile.
 */
@Component
@Profile("dev")
@Order(20)
public class DevInspectionsBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevInspectionsBootstrapRunner.class);

    private final DevUsersProperties properties;
    private final UserRepository userRepository;
    private final InspectionTemplateRepository templateRepository;
    private final InspectionRepository inspectionRepository;

    public DevInspectionsBootstrapRunner(DevUsersProperties properties,
                                         UserRepository userRepository,
                                         InspectionTemplateRepository templateRepository,
                                         InspectionRepository inspectionRepository) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.inspectionRepository = inspectionRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        if (inspectionRepository.count() > 0) {
            return; // already seeded
        }

        User technician = userRepository.findByEmail(properties.technician().email()).orElse(null);
        User supervisor = userRepository.findByEmail(properties.supervisor().email()).orElse(null);
        if (technician == null || supervisor == null
                || technician.getRole() != Role.TECHNICIAN) {
            log.warn("Skipping dev inspection seed: technician/supervisor dev accounts not found");
            return;
        }

        InspectionTemplate template = seedTemplate(supervisor);

        seedInspection(template, technician, supervisor,
                "Indústria Atlas", "Unidade Sorocaba", "Compressor XPTO 500",
                Priority.HIGH, InspectionStatus.ASSIGNED, 0,
                "Verificar vazamentos e pressão antes da liberação.");

        seedInspection(template, technician, supervisor,
                "Metalúrgica Vega", "Galpão Central", "Caldeira CL-10",
                Priority.MEDIUM, InspectionStatus.IN_PROGRESS, 40,
                "Inspeção periódica de segurança.");

        // Awaiting supervisor review — feeds the web review queue (status SUBMITTED / UNDER_REVIEW).
        seedInspection(template, technician, supervisor,
                "Indústria Atlas", "Unidade Sorocaba", "Bomba Centrífuga BC-200",
                Priority.HIGH, InspectionStatus.SUBMITTED, 100,
                "Enviada pelo técnico, aguardando aprovação.");

        seedInspection(template, technician, supervisor,
                "Logística ABC", "CD Campinas", "Empilhadeira EMP-07",
                Priority.CRITICAL, InspectionStatus.UNDER_REVIEW, 100,
                "Em análise pelo supervisor.");

        log.info("Bootstrapped dev inspections for technician {}", technician.getEmail());
    }

    private InspectionTemplate seedTemplate(User creator) {
        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Checklist de Segurança de Equipamento");
        template.setCategory("Segurança");
        template.setDescription("Template de demonstração para o profile dev.");
        template.setStatus(InspectionTemplateStatus.ACTIVE);
        template.setCurrentVersion(1);
        template.setCreatedBy(creator);

        TemplateSection general = new TemplateSection();
        general.setTemplate(template);
        general.setTitle("Inspeção Geral");
        general.setSortOrder(0);
        general.getItems().add(item(general, 0,
                "Equipamento apresenta vazamentos?", null,
                ResponseType.CONFORMITY, true, true, true, null));
        general.getItems().add(item(general, 1,
                "Nível de pressão dentro do especificado?", "Comparar com a placa do fabricante.",
                ResponseType.CONFORMITY, true, true, false, null));
        general.getItems().add(item(general, 2,
                "Observações gerais", null,
                ResponseType.TEXT_LONG, false, false, false, null));

        TemplateSection safety = new TemplateSection();
        safety.setTemplate(template);
        safety.setTitle("Itens de Segurança");
        safety.setSortOrder(1);
        safety.getItems().add(item(safety, 0,
                "Estado da sinalização de segurança", null,
                ResponseType.SINGLE_CHOICE, true, false, false,
                "[\"Bom\",\"Regular\",\"Ruim\"]"));
        safety.getItems().add(item(safety, 1,
                "Temperatura de operação (°C)", null,
                ResponseType.NUMBER, false, false, false, null));

        template.getSections().add(general);
        template.getSections().add(safety);

        return templateRepository.save(template);
    }

    private TemplateItem item(TemplateSection section, int sortOrder, String question, String description,
                              ResponseType type, boolean required, boolean obsOnFailure,
                              boolean evidenceOnFailure, String options) {
        TemplateItem item = new TemplateItem();
        item.setSection(section);
        item.setSortOrder(sortOrder);
        item.setQuestion(question);
        item.setDescription(description);
        item.setResponseType(type);
        item.setRequired(required);
        item.setRequireObservationOnFailure(obsOnFailure);
        item.setRequireEvidenceOnFailure(evidenceOnFailure);
        item.setOptions(options);
        return item;
    }

    private void seedInspection(InspectionTemplate template, User technician, User supervisor,
                                String clientName, String siteName, String equipmentName,
                                Priority priority, InspectionStatus status, int progress,
                                String instructions) {
        Inspection inspection = new Inspection();
        inspection.setTitle(template.getTitle() + " — " + equipmentName);
        inspection.setTemplate(template);
        inspection.setClientName(clientName);
        inspection.setSiteName(siteName);
        inspection.setEquipmentName(equipmentName);
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setPriority(priority);
        inspection.setStatus(status);
        inspection.setProgress(progress);
        inspection.setDueDate(LocalDate.now().plusDays(3));
        inspection.setDueTime(LocalTime.of(9, 0));
        inspection.setSupervisorInstructions(instructions);
        inspectionRepository.save(inspection);
    }
}
