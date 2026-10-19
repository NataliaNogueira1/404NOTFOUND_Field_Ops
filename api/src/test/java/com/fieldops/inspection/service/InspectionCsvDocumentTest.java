package com.fieldops.inspection.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class InspectionCsvDocumentTest {

    private final InspectionCsvDocument document = new InspectionCsvDocument();

    @Test
    void writesBomHeaderEscapedFieldsAndInjectionSafeValues() {
        InspectionExportRow row = new InspectionExportRow(7L, "=SUM(A1:A2)", "Acme, Inc.",
                "Plant\n1", "Compressor \"A\"", "Alex", "APPROVED", "HIGH",
                LocalDate.of(2026, 9, 26), Instant.parse("2026-09-01T10:00:00Z"),
                Instant.parse("2026-09-27T10:00:00Z"), 2L);

        String csv = document.write(List.of(row));

        assertThat(csv).startsWith("\uFEFFid,title,client,site,equipment,technician,status,priority,dueDate,");
        assertThat(csv).contains("\"'=SUM(A1:A2)\"");
        assertThat(csv).contains("\"Acme, Inc.\"");
        assertThat(csv).contains("\"Plant\n1\"");
        assertThat(csv).contains("\"Compressor \"\"A\"\"\"");
    }

    @Test
    void writesOnlyHeaderWhenThereAreNoRows() {
        String csv = document.write(List.of());

        assertThat(csv).isEqualTo(
                "\uFEFFid,title,client,site,equipment,technician,status,priority,dueDate,createdAt,completedAt,nonConformities\r\n");
    }
}
