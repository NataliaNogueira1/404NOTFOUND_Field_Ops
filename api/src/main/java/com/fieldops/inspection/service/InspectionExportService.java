package com.fieldops.inspection.service;

import com.fieldops.client.model.Client;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionExportService {

    private final InspectionRepository inspectionRepository;
    private final ClientRepository clientRepository;
    private final NonConformityRepository nonConformityRepository;
    private final InspectionCsvDocument inspectionCsvDocument;

    public InspectionExportService(InspectionRepository inspectionRepository, ClientRepository clientRepository,
            NonConformityRepository nonConformityRepository, InspectionCsvDocument inspectionCsvDocument) {
        this.inspectionRepository = inspectionRepository;
        this.clientRepository = clientRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.inspectionCsvDocument = inspectionCsvDocument;
    }

    /**
     * Exports filtered inspections as a spreadsheet-safe CSV document with a UTF-8 BOM.
     * The caller should return the string with a CSV download content type.
     */
    @Transactional(readOnly = true)
    public String export(InspectionStatus status, LocalDate from, LocalDate to, Long clientId) {
        String clientName = resolveClientName(clientId);
        List<Inspection> inspections = inspectionRepository.findAll(filters(status, from, to, clientName),
                Sort.by("dueDate").ascending().and(Sort.by("id").ascending()));
        Map<Long, Long> nonConformities = nonConformityCounts(inspections);
        List<InspectionExportRow> rows = inspections.stream()
                .map(inspection -> row(inspection, nonConformities))
                .toList();
        return inspectionCsvDocument.write(rows);
    }

    private String resolveClientName(Long clientId) {
        if (clientId == null) {
            return null;
        }
        return clientRepository.findById(clientId).map(Client::getName)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + clientId));
    }

    private Specification<Inspection> filters(InspectionStatus status, LocalDate from, LocalDate to,
            String clientName) {
        return (root, query, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            if (from != null) predicates.add(builder.greaterThanOrEqualTo(root.get("dueDate"), from));
            if (to != null) predicates.add(builder.lessThanOrEqualTo(root.get("dueDate"), to));
            if (clientName != null) predicates.add(builder.equal(builder.lower(root.get("clientName")),
                    clientName.toLowerCase(Locale.ROOT)));
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private Map<Long, Long> nonConformityCounts(List<Inspection> inspections) {
        if (inspections.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = inspections.stream().map(Inspection::getId).toList();
        return nonConformityRepository.countByInspectionIds(ids).stream()
                .collect(Collectors.toMap(count -> (Long) count[0], count -> (Long) count[1]));
    }

    private InspectionExportRow row(Inspection inspection, Map<Long, Long> nonConformities) {
        return new InspectionExportRow(inspection.getId(), inspection.getTitle(), inspection.getClientName(),
                inspection.getSiteName(), inspection.getEquipmentName(), inspection.getTechnician().getName(),
                inspection.getStatus().name(), inspection.getPriority().name(), inspection.getDueDate(),
                inspection.getCreatedAt(), inspection.getReviewedAt(),
                nonConformities.getOrDefault(inspection.getId(), 0L));
    }
}
