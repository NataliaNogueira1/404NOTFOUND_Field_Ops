package com.fieldops.inspection.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Serializes inspection export rows as UTF-8 CSV for spreadsheet applications. */
@Component
public class InspectionCsvDocument {

    private static final String HEADER = "id,title,client,site,equipment,technician,status,priority,"
            + "dueDate,createdAt,completedAt,nonConformities";

    public String write(List<InspectionExportRow> rows) {
        String body = rows.stream().map(this::line).collect(Collectors.joining("\r\n"));
        return "\uFEFF" + HEADER + "\r\n" + (body.isEmpty() ? "" : body + "\r\n");
    }

    private String line(InspectionExportRow row) {
        return String.join(",", number(row.id()), cell(row.title()), cell(row.client()), cell(row.site()),
                cell(row.equipment()), cell(row.technician()), cell(row.status()), cell(row.priority()),
                cell(row.dueDate()), cell(row.createdAt()), cell(row.completedAt()),
                number(row.nonConformities()));
    }

    private String number(Number value) {
        return value == null ? "" : value.toString();
    }

    private String cell(Object value) {
        String text = value == null ? "" : value.toString();
        String safe = needsInjectionGuard(text) ? "'" + text : text;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }

    private boolean needsInjectionGuard(String value) {
        return !value.isEmpty() && "=+-@".indexOf(value.charAt(0)) >= 0;
    }
}
