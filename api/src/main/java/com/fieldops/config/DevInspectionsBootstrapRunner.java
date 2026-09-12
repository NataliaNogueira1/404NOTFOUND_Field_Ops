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
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Seeds a handful of ASSIGNED inspections for the dev technician so the mobile
 * "start inspection" flow (PBI-034) can be exercised end-to-end.
 *
 * <p>Dev profile only. Runs after {@link DevUsersBootstrapRunner} (see {@link Order})
 * because it needs the technician/supervisor accounts to exist. It is idempotent:
 * if the technician already has inspections, nothing is created.
 */
@Component
@Profile("dev")
@Order(20) // after DevUsersBootstrapRunner (default order)
public class DevInspectionsBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevInspectionsBootstrapRunner.class);

    private static final String TECHNICIAN_EMAIL = "technician@fieldops.local";
    private static final String SUPERVISOR_EMAIL = "supervisor@fieldops.local";

    private final UserRepository userRepository;
    private final InspectionRepository inspectionRepository;
    private final InspectionTemplateRepository templateRepository;

    public DevInspectionsBootstrapRunner(UserRepository userRepository,
                                         InspectionRepository inspectionRepository,
                                         InspectionTemplateRepository templateRepository) {
        this.userRepository = userRepository;
        this.inspectionRepository = inspectionRepository;
        this.templateRepository = templateRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        User technician = userRepository.findByEmail(TECHNICIAN_EMAIL).orElse(null);
        User supervisor = userRepository.findByEmail(SUPERVISOR_EMAIL).orElse(null);

        if (technician == null || supervisor == null) {
            log.info("[DevSeed] Skipping inspection seed — dev technician/supervisor not found.");
            return;
        }

        // Idempotent: don't re-seed if this technician already has ASSIGNED inspections
        // waiting to be started. Existing IN_PROGRESS/other inspections are ignored, so
        // the technician always has fresh ASSIGNED ones to exercise the start flow (PBI-034).
        List<Inspection> assigned = inspectionRepository.findByTechnicianAndStatuses(
                technician.getId(), List.of(InspectionStatus.ASSIGNED));
        if (!assigned.isEmpty()) {
            log.info("[DevSeed] Technician already has {} ASSIGNED inspection(s); skipping seed.", assigned.size());
            return;
        }

        InspectionTemplate template = seedTemplate(supervisor);
        LocalDate today = LocalDate.now();

        inspectionRepository.saveAll(List.of(
                newInspection("Inspeção Preventiva — Compressor XPTO 500", template,
                        "Indústria Modelo", "Unidade Sorocaba", "Compressor XPTO 500",
                        technician, supervisor, Priority.HIGH, today, LocalTime.of(9, 0),
                        "Verificar condição da bateria com atenção especial."),
                newInspection("Inspeção Gerador Diesel GD-002", template,
                        "Logística ABC", "CD Campinas", "Gerador Diesel GD-002",
                        technician, supervisor, Priority.MEDIUM, today.plusDays(1), LocalTime.of(14, 0),
                        "Validar nível de combustível e resposta em carga."),
                newInspection("Inspeção Extintor P12", template,
                        "Indústria Modelo", "Unidade São Paulo", "Extintor P12",
                        technician, supervisor, Priority.LOW, today.plusDays(2), LocalTime.of(11, 30),
                        "Conferir lacre e validade da carga."),
                newInspection("Inspeção Empilhadeira 01", template,
                        "Metalúrgica Horizonte", "Centro Operacional Jundiaí", "Empilhadeira 01",
                        technician, supervisor, Priority.CRITICAL, today.plusDays(3), LocalTime.of(16, 0),
                        "Priorizar verificação de freio e sinais sonoros.")
        ));

        log.info("[DevSeed] Seeded 4 ASSIGNED inspections for technician {}.", TECHNICIAN_EMAIL);
    }

    private Inspection newInspection(String title, InspectionTemplate template,
                                     String clientName, String siteName, String equipmentName,
                                     User technician, User supervisor, Priority priority,
                                     LocalDate dueDate, LocalTime dueTime, String instructions) {
        Inspection inspection = new Inspection();
        inspection.setTitle(title);
        inspection.setTemplate(template);
        inspection.setClientName(clientName);
        inspection.setSiteName(siteName);
        inspection.setEquipmentName(equipmentName);
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(InspectionStatus.ASSIGNED);
        inspection.setPriority(priority);
        inspection.setDueDate(dueDate);
        inspection.setDueTime(dueTime);
        inspection.setSupervisorInstructions(instructions);
        inspection.setProgress(0);
        return inspection;
    }

    private InspectionTemplate seedTemplate(User createdBy) {
        InspectionTemplate template = new InspectionTemplate();
        template.setTitle("Inspeção Preventiva de Compressor");
        template.setCategory("Manutenção");
        template.setStatus(InspectionTemplateStatus.ACTIVE);
        template.setVersion(3);
        template.setCreatedBy(createdBy);

        addSection(template, "Condições Gerais", 0, List.of(
                item("A placa de identificação está legível?", ResponseType.CONFORMITY, true, true, true, null, 0),
                item("Equipamento limpo e conservado?", ResponseType.TEXT_LONG, true, true, true, null, 1),
                item("Estrutura externa sem danos?", ResponseType.BOOLEAN, true, false, false, null, 2)
        ));
        addSection(template, "Segurança", 1, List.of(
                item("Proteções das partes móveis instaladas?", ResponseType.CONFORMITY, true, true, true, null, 0),
                item("Etiquetas de advertência visíveis?", ResponseType.CONFORMITY, true, true, true, null, 1),
                item("Botão de emergência funcionando?", ResponseType.SINGLE_CHOICE, true, true, false,
                        "[\"Funcionando\",\"Intermitente\",\"Não funcionando\"]", 2)
        ));
        addSection(template, "Operação", 2, List.of(
                item("Pressão dentro da faixa?", ResponseType.NUMBER, true, true, false, null, 0),
                item("Vibração dentro do limite?", ResponseType.CONFORMITY, true, true, true, null, 1),
                item("Equipamento operando sem ruídos anormais?", ResponseType.TEXT_SHORT, true, false, false, null, 2)
        ));

        return templateRepository.save(template);
    }

    private void addSection(InspectionTemplate template, String title, int sortOrder, List<TemplateItem> items) {
        TemplateSection section = new TemplateSection();
        section.setTemplate(template);
        section.setTitle(title);
        section.setSortOrder(sortOrder);
        for (TemplateItem item : items) {
            item.setSection(section);
            section.getItems().add(item);
        }
        template.getSections().add(section);
    }

    private TemplateItem item(String question, ResponseType responseType, boolean required,
                              boolean requireObservationOnFailure, boolean requireEvidenceOnFailure,
                              String options, int sortOrder) {
        TemplateItem item = new TemplateItem();
        item.setQuestion(question);
        item.setResponseType(responseType);
        item.setRequired(required);
        item.setRequireObservationOnFailure(requireObservationOnFailure);
        item.setRequireEvidenceOnFailure(requireEvidenceOnFailure);
        item.setOptions(options);
        item.setSortOrder(sortOrder);
        return item;
    }
}
