package com.fieldops.report.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.user.model.User;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.openpdf.text.pdf.PdfReader;
import org.openpdf.text.pdf.parser.PdfTextExtractor;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class OpenPdfInspectionReportDocumentTest {

    private final OpenPdfInspectionReportDocument document = new OpenPdfInspectionReportDocument();

    @Test
    void generatesAReadablePdfForAnInspection() throws Exception {
        InspectionItemSnapshot item = mock(InspectionItemSnapshot.class);
        given(item.getSectionTitle()).willReturn("Electrical safety");
        given(item.getItemTitle()).willReturn("Grounding verified");
        InspectionAnswer answer = mock(InspectionAnswer.class);
        given(answer.getItemSnapshot()).willReturn(item);
        given(answer.getValue()).willReturn("PASS");
        given(answer.getObservation()).willReturn("No defect found");
        User answerAuthor = new User();
        answerAuthor.setName("Alex Technician");
        given(answer.getAnsweredBy()).willReturn(answerAuthor);
        InspectionEvidence evidence = mock(InspectionEvidence.class);
        given(evidence.getItemSnapshot()).willReturn(item);
        given(evidence.getReference()).willReturn("https://storage.example/evidence/grounding.jpg");
        given(evidence.getChecksum()).willReturn("sha256:abc123");

        byte[] pdf = document.generate(inspection(), List.of(), List.of(answer), List.of(evidence));

        assertThat(pdf).startsWith("%PDF".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        PdfReader reader = new PdfReader(pdf);
        assertThat(reader.getNumberOfPages()).isPositive();
        String content = new PdfTextExtractor(reader).getTextFromPage(1);
        assertThat(content).contains("Recorded answers", "PASS", "No defect found",
                "Evidence references", "https://storage.example/evidence/grounding.jpg", "sha256:abc123");
        reader.close();
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
