package com.fieldops.report.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.user.model.User;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.openpdf.text.pdf.PdfReader;

class OpenPdfInspectionReportDocumentTest {

    private final OpenPdfInspectionReportDocument document = new OpenPdfInspectionReportDocument();

    @Test
    void generatesAReadablePdfForAnInspection() throws Exception {
        byte[] pdf = document.generate(inspection(), List.of());

        assertThat(pdf).startsWith("%PDF".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        assertThat(new PdfReader(pdf).getNumberOfPages()).isPositive();
    }

    private Inspection inspection() {
        User technician = new User();
        technician.setName("Alex Technician");
        Inspection inspection = new Inspection();
        inspection.setTitle("Monthly safety inspection");
        inspection.setClientName("Acme Manufacturing");
        inspection.setSiteName("Plant 1");
        inspection.setEquipmentName("Compressor A");
        inspection.setTechnician(technician);
        inspection.setStatus(InspectionStatus.APPROVED);
        inspection.setPriority(Priority.HIGH);
        inspection.setDueDate(LocalDate.of(2026, 9, 26));
        inspection.setDueTime(LocalTime.of(10, 30));
        return inspection;
    }
}
