package com.fieldops.inspection.service;

import com.fieldops.audit.model.AuditAction;
import com.fieldops.audit.service.AuditService;
import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.inspection.dto.CancelInspectionResponse;
import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.dto.ReviewDecisionResponse;
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
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionService {

    /** Statuses from which an inspection may still be cancelled (RN-029). APPROVED is excluded (RN-030). */
    private static final Set<InspectionStatus> CANCELABLE_STATUSES = Set.of(
            InspectionStatus.ASSIGNED,
            InspectionStatus.IN_PROGRESS,
            InspectionStatus.SUBMITTED,
            InspectionStatus.UNDER_REVIEW,
            InspectionStatus.REJECTED);

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

    /**
     * Approves an inspection under review (PBI-060). Only an UNDER_REVIEW inspection can be
     * approved (state machine); the optional comment is stored. APPROVED is terminal, so the
     * frozen responses are effectively protected from further edits.
     */
    @Transactional
    public ReviewDecisionResponse approve(Long inspectionId, String comment, Long reviewerId) {
        Inspection inspection = requireReviewable(inspectionId);
        User reviewer = findUser(reviewerId);

        inspection.setStatus(InspectionStatus.APPROVED);
        inspection.setReviewedAt(Instant.now());
        inspection.setReviewedBy(reviewer);
        inspection.setReviewComment(trimToNull(comment));
        Inspection saved = inspectionRepository.save(inspection);

        auditService.recordInspection(reviewer.getId(), AuditAction.INSPECTION_APPROVED, saved.getId(),
                saved.getReviewComment());

        return new ReviewDecisionResponse(saved.getId(), saved.getStatus(), saved.getReviewedAt(),
                reviewer.getId(), saved.getReviewComment(), null);
    }

    /**
     * Rejects an inspection under review with a mandatory reason (PBI-061). Only an
     * UNDER_REVIEW inspection can be rejected (state machine).
     */
    @Transactional
    public ReviewDecisionResponse reject(Long inspectionId, String reason, Long reviewerId) {
        Inspection inspection = requireReviewable(inspectionId);
        User reviewer = findUser(reviewerId);

        inspection.setStatus(InspectionStatus.REJECTED);
        inspection.setReviewedAt(Instant.now());
        inspection.setReviewedBy(reviewer);
        inspection.setRejectionReason(reason.trim());
        Inspection saved = inspectionRepository.save(inspection);

        auditService.recordInspection(reviewer.getId(), AuditAction.INSPECTION_REJECTED, saved.getId(),
                saved.getRejectionReason());

        return new ReviewDecisionResponse(saved.getId(), saved.getStatus(), saved.getReviewedAt(),
                reviewer.getId(), null, saved.getRejectionReason());
    }

    /** Loads an inspection and enforces that it is currently UNDER_REVIEW (RN state machine). */
    private Inspection requireReviewable(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));
        if (inspection.getStatus() != InspectionStatus.UNDER_REVIEW) {
            throw new BusinessException(
                    "Inspection must be under review to be approved or rejected, but was "
                            + inspection.getStatus());
        }
        return inspection;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Cancels an inspection with a mandatory justification (PBI-029).
     * Enforces the state machine (RN-029/RN-030): APPROVED or already CANCELED inspections
     * cannot be cancelled and raise a business rule violation (422).
     */
    @Transactional
    public CancelInspectionResponse cancel(Long inspectionId, String reason, Long actorId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found: " + inspectionId));

        if (!CANCELABLE_STATUSES.contains(inspection.getStatus())) {
            throw new BusinessException(
                    "Inspection cannot be canceled from status " + inspection.getStatus());
        }

        User actor = findUser(actorId);
        inspection.setStatus(InspectionStatus.CANCELED);
        inspection.setCanceledAt(Instant.now());
        inspection.setCanceledBy(actor);
        inspection.setCanceledReason(reason.trim());
        Inspection saved = inspectionRepository.save(inspection);

        auditService.recordInspection(actor.getId(), AuditAction.INSPECTION_CANCELED, saved.getId(),
                saved.getCanceledReason());

        return new CancelInspectionResponse(saved.getId(), saved.getStatus(),
                saved.getCanceledAt(), actor.getId(), saved.getCanceledReason());
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
        if (technician.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("TECHNICIAN_NOT_ACTIVE",
                    "Assigned technician must be active: " + technician.getId());
        }
    }

    private InspectionTemplateVersion findVersion(Long id) {
        InspectionTemplateVersion version = versionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection template version not found: " + id));
        if (!version.isPublished()) {
            throw new BusinessException("TEMPLATE_VERSION_NOT_PUBLISHED",
                    "Inspection template version must be published: " + id);
        }
        return version;
    }

    private Client findClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
        if (client.getStatus() != ClientStatus.ACTIVE) {
            throw new BusinessException("CLIENT_NOT_ACTIVE", "Client must be active: " + id);
        }
        return client;
    }

    private InspectionSite findSite(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));
    }

    private Equipment findEquipment(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));
        if (equipment.getStatus() != EquipmentStatus.ACTIVE) {
            throw new BusinessException("EQUIPMENT_NOT_ACTIVE", "Equipment must be active: " + id);
        }
        return equipment;
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
