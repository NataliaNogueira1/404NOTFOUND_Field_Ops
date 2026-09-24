package com.fieldops.inspection.service;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Generates a UTF-8 BOM CSV file from the inspection list, applying the same
 * operational filters as the admin listing endpoint.
 *
 * <p>CSV injection prevention: any field whose trimmed value starts with one of
 * {@code = + - @} (common formula-trigger characters in spreadsheet apps) is
 * prefixed with a single quote {@code '} so the cell is treated as text.</p>
 *
 * <p>UTF-8 BOM (EF BB BF) is prepended so Excel opens the file with the correct
 * encoding without requiring the user to use the import wizard.</p>
 */
@Service
public class InspectionExportService {

    private static final byte[] UTF8_BOM = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String[] HEADERS = {
            "ID", "Título", "Cliente", "Local", "Equipamento",
            "Técnico", "Estado", "Prioridade", "Data prevista",
            "Criado em", "Concluído em", "Nº de NCs"
    };

    private static final List<InspectionStatus> TERMINAL_STATUSES = List.of(
            InspectionStatus.APPROVED, InspectionStatus.CANCELED, InspectionStatus.REJECTED);

    private final InspectionRepository inspectionRepository;

    public InspectionExportService(InspectionRepository inspectionRepository) {
        this.inspectionRepository = inspectionRepository;
    }

    /**
     * Exports all inspections matching the given filters as a UTF-8 BOM CSV byte array.
     * Returns only the header row when no inspections match (never throws for empty results).
     *
     * @param status     optional exact status filter
     * @param from       optional dueDate range start (inclusive)
     * @param to         optional dueDate range end (inclusive)
     * @param clientName optional client name filter (case-insensitive)
     */
    @Transactional(readOnly = true)
    public byte[] export(InspectionStatus status, LocalDate from, LocalDate to, String clientName) {
        List<Inspection> inspections = inspectionRepository.findAll(
                buildSpec(status, from, to, clientName));

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try {
            buffer.write(UTF8_BOM);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write BOM", e);
        }

        try (PrintWriter writer = new PrintWriter(
                new OutputStreamWriter(buffer, StandardCharsets.UTF_8), true)) {

            // Header row
            writer.println(String.join(",", HEADERS));

            // Data rows
            for (Inspection i : inspections) {
                writer.println(buildRow(i));
            }
        }

        return buffer.toByteArray();
    }

    // ── Spec builder ──────────────────────────────────────────────────────────

    private Specification<Inspection> buildSpec(InspectionStatus status, LocalDate from,
                                                 LocalDate to, String clientName) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("dueDate"), from));
            }
            if (to != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("dueDate"), to));
            }
            if (clientName != null && !clientName.isBlank()) {
                predicates.add(builder.equal(
                        builder.lower(root.get("clientName")),
                        clientName.trim().toLowerCase(Locale.ROOT)));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    // ── Row builder ───────────────────────────────────────────────────────────

    private String buildRow(Inspection i) {
        // "Concluído em" = reviewedAt when APPROVED, otherwise blank
        String concludedAt = "";
        if (i.getStatus() == InspectionStatus.APPROVED && i.getReviewedAt() != null) {
            concludedAt = i.getReviewedAt()
                    .atZone(java.time.ZoneOffset.UTC)
                    .toLocalDate()
                    .format(DATE_FMT);
        }

        // nº de NCs: not yet implemented in backend domain — always 0
        String ncCount = "0";

        return String.join(",",
                escape(String.valueOf(i.getId())),
                escape(i.getTitle()),
                escape(i.getClientName()),
                escape(i.getSiteName()),
                escape(i.getEquipmentName() != null ? i.getEquipmentName() : ""),
                escape(i.getTechnician().getName()),
                escape(i.getStatus().name()),
                escape(i.getPriority().name()),
                escape(i.getDueDate().format(DATE_FMT)),
                escape(i.getCreatedAt().atZone(java.time.ZoneOffset.UTC)
                        .toLocalDate().format(DATE_FMT)),
                escape(concludedAt),
                escape(ncCount)
        );
    }

    // ── CSV helpers ───────────────────────────────────────────────────────────

    /**
     * Escapes a single CSV field:
     * <ul>
     *   <li>Wraps in double quotes if it contains comma, double-quote or newline.</li>
     *   <li>Escapes internal double-quotes by doubling them.</li>
     *   <li>Prefixes formula-injection characters ({@code = + - @}) with {@code '}.</li>
     *   <li>Never returns null — converts null to empty string.</li>
     * </ul>
     */
    static String escape(String value) {
        if (value == null) return "";

        // Anti CSV-injection: sanitize formula-trigger characters
        String sanitized = value;
        if (!sanitized.isEmpty() && "=+-@\t\r".indexOf(sanitized.charAt(0)) >= 0) {
            sanitized = "'" + sanitized;
        }

        // Quote if necessary
        boolean needsQuoting = sanitized.contains(",")
                || sanitized.contains("\"")
                || sanitized.contains("\n")
                || sanitized.contains("\r");

        if (needsQuoting) {
            sanitized = sanitized.replace("\"", "\"\""); // double-up internal quotes
            return "\"" + sanitized + "\"";
        }
        return sanitized;
    }
}
