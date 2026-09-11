package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.ScheduleInspectionRequest;
import com.fieldops.inspection.dto.ScheduleInspectionResponse;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionTemplateRepository templateRepository;
    private final UserRepository userRepository;

    public InspectionService(InspectionRepository inspectionRepository,
                             InspectionTemplateRepository templateRepository,
                             UserRepository userRepository) {
        this.inspectionRepository = inspectionRepository;
        this.templateRepository = templateRepository;
        this.userRepository = userRepository;
    }

    /**
     * Schedules a new inspection from a published (ACTIVE) template.
     * The inspection is immediately set to ASSIGNED status.
     *
     * @param request    validated scheduling data from the API caller
     * @param supervisorId the ID of the authenticated supervisor creating the inspection
     * @return a full response DTO with all resolved fields
     */
    @Transactional
    public ScheduleInspectionResponse scheduleInspection(ScheduleInspectionRequest request, Long supervisorId) {

        // Resolve and validate the template — must be ACTIVE (published)
        InspectionTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inspection template not found: " + request.templateId()));
        if (template.getStatus() != InspectionTemplateStatus.ACTIVE) {
            throw new BusinessException(
                    "Only published (ACTIVE) templates can be used to schedule inspections. "
                    + "Template '" + template.getTitle() + "' is " + template.getStatus());
        }

        // Resolve technician — must exist and have the TECHNICIAN role
        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Technician not found: " + request.technicianId()));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new BusinessException(
                    "User " + request.technicianId() + " is not a technician");
        }

        // Resolve supervisor
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supervisor not found: " + supervisorId));

        // Build the title from equipment and template name (mirrors the frontend prototype pattern)
        String title = template.getTitle() + " — " + request.equipmentName();

        // Assemble and persist the inspection
        Inspection inspection = new Inspection();
        inspection.setTitle(title);
        inspection.setTemplate(template);
        inspection.setClientName(request.clientName().trim());
        inspection.setSiteName(request.siteName().trim());
        inspection.setEquipmentName(request.equipmentName().trim());
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setPriority(request.priority());
        inspection.setDueDate(request.dueDate());
        inspection.setDueTime(request.dueTime());
        inspection.setSupervisorInstructions(request.supervisorInstructions());
        inspection.setStatus(InspectionStatus.ASSIGNED);
        inspection.setProgress(0);

        Inspection saved = inspectionRepository.save(inspection);

        return toResponse(saved);
    }

    private ScheduleInspectionResponse toResponse(Inspection inspection) {
        InspectionTemplate template = inspection.getTemplate();
        User technician = inspection.getTechnician();
        User supervisor = inspection.getSupervisor();
        return new ScheduleInspectionResponse(
                inspection.getId(),
                inspection.getTitle(),
                template.getId(),
                template.getTitle(),
                inspection.getClientName(),
                inspection.getSiteName(),
                inspection.getEquipmentName(),
                technician.getId(),
                technician.getName(),
                supervisor.getId(),
                supervisor.getName(),
                inspection.getPriority(),
                inspection.getDueDate(),
                inspection.getDueTime(),
                inspection.getSupervisorInstructions(),
                inspection.getStatus(),
                inspection.getProgress(),
                inspection.getCreatedAt());
    }
}
