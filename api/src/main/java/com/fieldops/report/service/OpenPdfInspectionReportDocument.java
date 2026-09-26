package com.fieldops.report.service;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.nonconformity.model.NonConformity;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Font;
import org.openpdf.text.Paragraph;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

/** OpenPDF implementation kept behind {@link InspectionReportDocument}. */
@Component
public class OpenPdfInspectionReportDocument implements InspectionReportDocument {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 18, Font.BOLD);
    private static final Font SECTION_FONT = new Font(Font.HELVETICA, 13, Font.BOLD);
    private static final DateTimeFormatter INSTANT_FORMAT = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm 'UTC'").withZone(ZoneOffset.UTC);

    @Override
    public byte[] generate(Inspection inspection, List<NonConformity> nonConformities,
            List<InspectionAnswer> answers, List<InspectionEvidence> evidences) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, output);
            document.open();
            addHeader(document, inspection);
            addDecision(document, inspection);
            addChecklist(document, inspection.getItemSnapshots());
            addAnswers(document, answers);
            addNonConformities(document, nonConformities);
            addEvidences(document, evidences);
            document.close();
            return output.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Unable to generate inspection PDF", exception);
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("Unable to close inspection PDF stream", exception);
        }
    }

    private void addHeader(Document document, Inspection inspection) throws DocumentException {
        document.add(new Paragraph("Inspection report", TITLE_FONT));
        document.add(new Paragraph("Title: " + value(inspection.getTitle())));
        document.add(metadataTable(inspection));
        document.add(new Paragraph(" "));
    }

    private PdfPTable metadataTable(Inspection inspection) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        addMetadata(table, "Client", inspection.getClientName());
        addMetadata(table, "Site", inspection.getSiteName());
        addMetadata(table, "Equipment", inspection.getEquipmentName());
        addMetadata(table, "Technician", inspection.getTechnician().getName());
        addMetadata(table, "Due date", inspection.getDueDate().toString());
        addMetadata(table, "Due time", inspection.getDueTime() == null ? null : inspection.getDueTime().toString());
        return table;
    }

    private void addMetadata(PdfPTable table, String label, String value) {
        table.addCell(cell(label, Font.BOLD));
        table.addCell(cell(value(value), Font.NORMAL));
    }

    private void addDecision(Document document, Inspection inspection) throws DocumentException {
        document.add(new Paragraph("Decision", SECTION_FONT));
        document.add(new Paragraph("Status: " + inspection.getStatus()));
        addOptionalLine(document, "Reviewed at", inspection.getReviewedAt());
        addOptionalLine(document, "Approval comment", inspection.getReviewComment());
        addOptionalLine(document, "Rejection reason", inspection.getRejectionReason());
        document.add(new Paragraph(" "));
    }

    private void addOptionalLine(Document document, String label, Instant value) throws DocumentException {
        if (value != null) {
            document.add(new Paragraph(label + ": " + INSTANT_FORMAT.format(value)));
        }
    }

    private void addOptionalLine(Document document, String label, String value) throws DocumentException {
        if (value != null && !value.isBlank()) {
            document.add(new Paragraph(label + ": " + value));
        }
    }

    private void addChecklist(Document document, List<InspectionItemSnapshot> snapshots)
            throws DocumentException {
        document.add(new Paragraph("Checklist snapshot", SECTION_FONT));
        snapshots.stream().sorted(Comparator.comparing(InspectionItemSnapshot::getSectionOrder)
                .thenComparing(InspectionItemSnapshot::getItemOrder)).forEach(snapshot -> addItem(document, snapshot));
        if (snapshots.isEmpty()) {
            document.add(new Paragraph("No checklist items were recorded."));
        }
        document.add(new Paragraph(" "));
    }

    private void addItem(Document document, InspectionItemSnapshot snapshot) {
        try {
            document.add(new Paragraph(snapshot.getSectionTitle() + " — " + snapshot.getItemTitle()));
            document.add(new Paragraph("Response type: " + snapshot.getResponseType()));
        } catch (DocumentException exception) {
            throw new IllegalStateException("Unable to add checklist item to inspection PDF", exception);
        }
    }

    private void addNonConformities(Document document, List<NonConformity> nonConformities)
            throws DocumentException {
        document.add(new Paragraph("Non-conformities", SECTION_FONT));
        if (nonConformities.isEmpty()) {
            document.add(new Paragraph("No non-conformities were recorded."));
            return;
        }
        for (NonConformity nonConformity : nonConformities) {
            document.add(new Paragraph(nonConformity.getSeverity() + " — " + nonConformity.getTitle()));
            document.add(new Paragraph(value(nonConformity.getDescription())));
        }
    }

    private void addAnswers(Document document, List<InspectionAnswer> answers) throws DocumentException {
        document.add(new Paragraph("Recorded answers", SECTION_FONT));
        if (answers.isEmpty()) {
            document.add(new Paragraph("No answers were recorded."));
        }
        for (InspectionAnswer answer : answers) {
            InspectionItemSnapshot item = answer.getItemSnapshot();
            document.add(new Paragraph(item.getSectionTitle() + " — " + item.getItemTitle()));
            document.add(new Paragraph("Value: " + value(answer.getValue())));
            addOptionalLine(document, "Observation", answer.getObservation());
            addOptionalLine(document, "Answered at", answer.getAnsweredAt());
            document.add(new Paragraph("Answered by: " + value(answer.getAnsweredBy().getName())));
        }
        document.add(new Paragraph(" "));
    }

    private void addEvidences(Document document, List<InspectionEvidence> evidences)
            throws DocumentException {
        document.add(new Paragraph("Evidence references", SECTION_FONT));
        if (evidences.isEmpty()) {
            document.add(new Paragraph("No evidence references were recorded."));
        }
        for (InspectionEvidence evidence : evidences) {
            if (evidence.getItemSnapshot() != null) {
                document.add(new Paragraph(evidence.getItemSnapshot().getSectionTitle() + " — "
                        + evidence.getItemSnapshot().getItemTitle()));
            }
            document.add(new Paragraph("Reference: " + value(evidence.getReference())));
            document.add(new Paragraph("Checksum: " + value(evidence.getChecksum())));
            addOptionalLine(document, "Description", evidence.getDescription());
            addOptionalLine(document, "Captured at", evidence.getCapturedAt());
        }
    }

    private PdfPCell cell(String value, int style) {
        return new PdfPCell(new Paragraph(value, new Font(Font.HELVETICA, 10, style)));
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "Not recorded" : value;
    }
}
