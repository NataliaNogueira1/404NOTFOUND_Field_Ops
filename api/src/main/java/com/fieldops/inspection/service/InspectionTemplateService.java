package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.InspectionTemplateRequest;
import com.fieldops.inspection.dto.InspectionTemplatePreviewResponse;
import com.fieldops.inspection.dto.InspectionTemplateResponse;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionTemplateService {

    private final InspectionTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final TemplateSectionService sectionService;
    private final InspectionTemplatePublicationValidator publicationValidator;

    public InspectionTemplateService(InspectionTemplateRepository templateRepository, UserRepository userRepository,
            TemplateSectionService sectionService, InspectionTemplatePublicationValidator publicationValidator) {
        this.templateRepository = templateRepository;
        this.userRepository = userRepository;
        this.sectionService = sectionService;
        this.publicationValidator = publicationValidator;
    }

    /** Creates an empty inspection template owned by the authenticated user. */
    @Transactional
    public InspectionTemplateResponse createDraft(InspectionTemplateRequest request, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorId));
        InspectionTemplate template = new InspectionTemplate();
        applyMetadata(template, request);
        template.setStatus(InspectionTemplateStatus.DRAFT);
        template.setCurrentVersion(0);
        template.setCreatedBy(creator);
        return toResponse(templateRepository.save(template));
    }

    /** Returns one template so the web builder can load a newly created draft. */
    @Transactional(readOnly = true)
    public InspectionTemplateResponse getById(Long id) {
        return toResponse(findById(id));
    }

    /** Returns the read-only checklist and every issue that would prevent publication. */
    @Transactional(readOnly = true)
    public InspectionTemplatePreviewResponse preview(Long id) {
        InspectionTemplate template = findById(id);
        List<String> issues = publicationValidator.validate(template);
        return new InspectionTemplatePreviewResponse(toResponse(template), issues.isEmpty(), issues);
    }

    /** Updates metadata while the inspection template remains a draft. */
    @Transactional
    public InspectionTemplateResponse updateDraft(Long id, InspectionTemplateRequest request) {
        InspectionTemplate template = findById(id);
        if (template.getStatus() != InspectionTemplateStatus.DRAFT) {
            throw new BusinessException("Only DRAFT inspection templates can be edited: " + id);
        }
        applyMetadata(template, request);
        return toResponse(template);
    }

    private InspectionTemplate findById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection template not found: " + id));
    }

    private void applyMetadata(InspectionTemplate template, InspectionTemplateRequest request) {
        template.setTitle(request.title().trim());
        template.setDescription(normalizeDescription(request.description()));
        template.setCategory(request.category().trim());
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private InspectionTemplateResponse toResponse(InspectionTemplate template) {
        return new InspectionTemplateResponse(template.getId(), template.getTitle(), template.getDescription(),
                template.getCategory(), template.getStatus(), template.getCurrentVersion(),
                template.getCreatedBy().getId(), template.getCreatedAt(), template.getUpdatedAt(),
                template.getRowVersion(), sectionService.toOrderedResponses(template.getSections()));
    }
}
