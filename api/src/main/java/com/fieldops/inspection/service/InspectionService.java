package com.fieldops.inspection.service;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.service.AuditService;
import com.fieldops.client.model.Client;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplateVersion;
import com.fieldops.inspection.model.TemplateItem;
import com.fieldops.inspection.model.TemplateSection;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateVersionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.repository.InspectionSiteRepository;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionTemplateVersionRepository versionRepository;
    private final ClientRepository clientRepository;
    private final InspectionSiteRepository siteRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public InspectionService(InspectionRepository inspectionRepository,
            InspectionTemplateVersionRepository versionRepository, ClientRepository clientRepository,
            InspectionSiteRepository siteRepository, EquipmentRepository equipmentRepository,
            UserRepository userRepository, AuditService auditService) {
        this.inspectionRepository = inspectionRepository;
        this.versionRepository = versionRepository;
        this.clientRepository = clientRepository;
        this.siteRepository = siteRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /** Creates an assigned inspection and freezes every checklist item from the selected version. */
    @Transactional
    public InspectionResponse createInspection(CreateInspectionRequest request, Long supervisorId) {
        InspectionTemplateVersion version = findVersion(request.templateVersionId());
        Client client = findClient(request.clientId());
        InspectionSite site = findSite(request.siteId());
        Equipment equipment = findEquipment(request.equipmentId());
        User technician = findUser(request.technicianId());
        User supervisor = findUser(supervisorId);
        validateAssignment(client, site, equipment, technician);

        Inspection inspection = buildInspection(request, version, client, site, equipment, technician, supervisor);
        copyChecklist(version, inspection);
        Inspection saved = inspectionRepository.save(inspection);

        // Scheduling creates an inspection already ASSIGNED to a technician: record both events.
        auditService.recordInspection(supervisorId, AuditAction.INSPECTION_CREATED, saved.getId(), null);
        auditService.recordInspection(supervisorId, AuditAction.INSPECTION_ASSIGNED, saved.getId(),
                "technicianId=" + technician.getId());

        return toResponse(saved);
    }

    private Inspection buildInspection(CreateInspectionRequest request, InspectionTemplateVersion version,
            Client client, InspectionSite site, Equipment equipment, User technician, User supervisor) {
        Inspection inspection = new Inspection();
        inspection.setTitle(request.title().trim());
        inspection.setTemplate(version.getTemplate());
        inspection.setTemplateVersion(version);
        inspection.setClientName(client.getName());
        inspection.setSiteName(site.getName());
        inspection.setEquipmentName(equipment.getName());
        inspection.setTechnician(technician);
        inspection.setSupervisor(supervisor);
        inspection.setStatus(InspectionStatus.ASSIGNED);
        inspection.setPriority(request.priority());
        inspection.setDueDate(request.dueDate());
        inspection.setDueTime(request.dueTime());
        inspection.setSupervisorInstructions(request.supervisorInstructions());
        return inspection;
    }

    private void copyChecklist(InspectionTemplateVersion version, Inspection inspection) {
        for (TemplateSection section : version.getTemplate().getSections()) {
            for (TemplateItem item : section.getItems()) {
                inspection.addItemSnapshot(InspectionItemSnapshot.from(inspection, section, item));
            }
        }
    }

    private void validateAssignment(Client client, InspectionSite site, Equipment equipment, User technician) {
        if (!Objects.equals(site.getClient().getId(), client.getId()) && site.getClient() != client) {
            throw new BusinessException("Inspection site does not belong to client: " + client.getId());
        }
        if (!Objects.equals(equipment.getSite().getId(), site.getId()) && equipment.getSite() != site) {
            throw new BusinessException("Equipment does not belong to inspection site: " + site.getId());
        }
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new BusinessException("Assigned user must have TECHNICIAN role: " + technician.getId());
        }
    }

    private InspectionTemplateVersion findVersion(Long id) {
        return versionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection template version not found: " + id));
    }

    private Client findClient(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
    }

    private InspectionSite findSite(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));
    }

    private Equipment findEquipment(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private InspectionResponse toResponse(Inspection inspection) {
        return new InspectionResponse(inspection.getId(), inspection.getTitle(), inspection.getStatus(),
                inspection.getDueDate().toString(), inspection.getClientName(), inspection.getEquipmentName(),
                inspection.getTechnician().getName());
    }
}
