package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.InspectionTemplateVersionResponse;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.InspectionTemplateVersion;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.inspection.repository.InspectionTemplateVersionRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionTemplateVersionService {

    private final InspectionTemplateRepository templateRepository;
    private final InspectionTemplateVersionRepository versionRepository;
    private final UserRepository userRepository;
    private final InspectionTemplatePublicationValidator validator;

    public InspectionTemplateVersionService(InspectionTemplateRepository templateRepository,
            InspectionTemplateVersionRepository versionRepository, UserRepository userRepository,
            InspectionTemplatePublicationValidator validator) {
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
        this.userRepository = userRepository;
        this.validator = validator;
    }

    /** Publishes an immutable, sequential snapshot. Use only with the authenticated publisher ID. */
    @Transactional
    public InspectionTemplateVersionResponse publish(Long templateId, Long publisherId) {
        InspectionTemplate template = templateRepository.findByIdForUpdate(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection template not found: " + templateId));
        requireDraft(template);
        List<String> issues = validator.validate(template);
        if (!issues.isEmpty()) {
            throw new BusinessException("Inspection template cannot be published: " + String.join("; ", issues));
        }
        User publisher = userRepository.findById(publisherId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + publisherId));
        int versionNumber = versionRepository.findMaximumVersionNumber(templateId) + 1;
        InspectionTemplateVersion version = InspectionTemplateVersion.publish(
                template, versionNumber, publisher, Instant.now());
        template.setCurrentVersion(versionNumber);
        template.setStatus(InspectionTemplateStatus.ACTIVE);
        return toResponse(versionRepository.save(version));
    }

    /** Lists immutable publication history. Use this to display every version in chronological order. */
    @Transactional(readOnly = true)
    public List<InspectionTemplateVersionResponse> list(Long templateId) {
        if (!templateRepository.existsById(templateId)) {
            throw new ResourceNotFoundException("Inspection template not found: " + templateId);
        }
        return versionRepository.findByTemplateIdOrderByVersionNumberAsc(templateId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void requireDraft(InspectionTemplate template) {
        if (template.getStatus() != InspectionTemplateStatus.DRAFT) {
            throw new BusinessException("Only DRAFT inspection templates can be published: " + template.getId());
        }
    }

    private InspectionTemplateVersionResponse toResponse(InspectionTemplateVersion version) {
        return new InspectionTemplateVersionResponse(version.getId(), version.getVersionNumber(),
                version.getTitleSnapshot(), version.getDescriptionSnapshot(), version.getPublishedAt(),
                version.getPublishedBy().getId());
    }
}
