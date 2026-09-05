package com.fieldops.inspection.service;

import com.fieldops.inspection.dto.AdminInspectionSummary;
import com.fieldops.inspection.dto.InspectionTemplateSummary;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.InspectionTemplate;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.repository.InspectionTemplateRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AdminCatalogListService {

    private static final List<InspectionStatus> REVIEW_STATUSES = List.of(
            InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW);
    private static final List<InspectionStatus> TERMINAL_STATUSES = List.of(
            InspectionStatus.APPROVED, InspectionStatus.CANCELED);

    private final InspectionTemplateRepository templateRepository;
    private final InspectionRepository inspectionRepository;

    public AdminCatalogListService(InspectionTemplateRepository templateRepository,
                                   InspectionRepository inspectionRepository) {
        this.templateRepository = templateRepository;
        this.inspectionRepository = inspectionRepository;
    }

    /** Lists inspection templates with textual, status, sorting, and page controls. */
    @Transactional(readOnly = true)
    public Page<InspectionTemplateSummary> listTemplates(String name, InspectionTemplateStatus status,
                                                          Pageable pageable) {
        return templateRepository.findAll(templateFilters(name, status), pageable).map(this::templateSummary);
    }

    /** Lists admin inspections with database-backed operational filters. */
    @Transactional(readOnly = true)
    public Page<AdminInspectionSummary> listInspections(String name, InspectionStatus status,
            String technicianName, String clientName, Priority priority, LocalDate dueDate,
            Boolean overdue, Boolean review, Pageable pageable) {
        Specification<Inspection> filters = inspectionFilters(name, status, technicianName, clientName,
                priority, dueDate, overdue, review);
        return inspectionRepository.findAll(filters, pageable).map(this::inspectionSummary);
    }

    private Specification<InspectionTemplate> templateFilters(String name, InspectionTemplateStatus status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (name != null && !name.isBlank()) {
                String pattern = pattern(name);
                predicates.add(builder.or(builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("category")), pattern)));
            }
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Inspection> inspectionFilters(String name, InspectionStatus status,
            String technicianName, String clientName, Priority priority, LocalDate dueDate,
            Boolean overdue, Boolean review) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            addTextFilter(predicates, root, builder, name);
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            if (technicianName != null && !technicianName.isBlank()) {
                predicates.add(builder.equal(builder.lower(root.get("technician").get("name")),
                        technicianName.toLowerCase(Locale.ROOT)));
            }
            if (clientName != null && !clientName.isBlank()) {
                predicates.add(builder.equal(builder.lower(root.get("clientName")), clientName.toLowerCase(Locale.ROOT)));
            }
            if (priority != null) predicates.add(builder.equal(root.get("priority"), priority));
            if (dueDate != null) predicates.add(builder.equal(root.get("dueDate"), dueDate));
            if (Boolean.TRUE.equals(overdue)) {
                predicates.add(builder.lessThan(root.get("dueDate"), LocalDate.now()));
                predicates.add(builder.not(root.get("status").in(TERMINAL_STATUSES)));
            }
            if (Boolean.TRUE.equals(review)) predicates.add(root.get("status").in(REVIEW_STATUSES));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void addTextFilter(List<Predicate> predicates, jakarta.persistence.criteria.Root<Inspection> root,
            jakarta.persistence.criteria.CriteriaBuilder builder, String name) {
        if (name == null || name.isBlank()) return;
        String pattern = pattern(name);
        predicates.add(builder.or(builder.like(builder.lower(root.get("title")), pattern),
                builder.like(builder.lower(root.get("clientName")), pattern),
                builder.like(builder.lower(root.get("equipmentName")), pattern)));
    }

    private String pattern(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }

    private InspectionTemplateSummary templateSummary(InspectionTemplate template) {
        long items = template.getSections().stream().mapToLong(section -> section.getItems().size()).sum();
        return new InspectionTemplateSummary(template.getId(), template.getTitle(), template.getCategory(),
                template.getVersion(), template.getSections().size(), items,
                template.getStatus().name());
    }

    private AdminInspectionSummary inspectionSummary(Inspection inspection) {
        boolean overdue = inspection.getDueDate().isBefore(LocalDate.now())
                && !TERMINAL_STATUSES.contains(inspection.getStatus());
        return new AdminInspectionSummary(inspection.getId(), inspection.getTitle(), inspection.getClientName(),
                inspection.getSiteName(), inspection.getEquipmentName(), inspection.getTechnician().getId(),
                inspection.getTechnician().getName(), inspection.getPriority(), inspection.getDueDate(),
                inspection.getStatus(), inspection.getProgress(), overdue);
    }
}
