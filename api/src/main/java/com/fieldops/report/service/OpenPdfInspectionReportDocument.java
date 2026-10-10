package com.fieldops.report.service;

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
            List<ReportAnswer> answers, List<InspectionEvidence> evidences) {
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
        Paragraph title = new Paragraph("Inspection report", TITLE_FONT);
        title.setSpacingAfter(8f);
        document.add(title);
        Paragraph subtitle = new Paragraph("Title: " + value(inspection.getTitle()));
        subtitle.setSpacingAfter(10f);
        document.add(subtitle);
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
        document.add(section("Decision"));
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
        document.add(section("Checklist snapshot"));
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
        document.add(section("Non-conformities"));
        if (nonConformities.isEmpty()) {
            document.add(new Paragraph("No non-conformities were recorded."));
            return;
        }
        for (NonConformity nonConformity : nonConformities) {
            document.add(new Paragraph(nonConformity.getSeverity() + " — " + nonConformity.getTitle()));
            document.add(new Paragraph(value(nonConformity.getDescription())));
        }
    }

    private void addAnswers(Document document, List<ReportAnswer> answers) throws DocumentException {
        document.add(section("Recorded answers"));
        if (answers.isEmpty()) {
            document.add(new Paragraph("No answers were recorded."));
        }
        for (ReportAnswer answer : answers) {
            document.add(new Paragraph(value(answer.sectionTitle()) + " — " + value(answer.itemTitle())));
            document.add(new Paragraph("Value: " + value(answer.value())));
            addOptionalLine(document, "Observation", answer.observation());
            addOptionalLine(document, "Answered at", answer.answeredAt());
            document.add(new Paragraph("Answered by: " + value(answer.answeredBy())));
        }
        document.add(new Paragraph(" "));
    }

    private void addEvidences(Document document, List<InspectionEvidence> evidences)
            throws DocumentException {
        document.add(section("Evidence references"));
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

    private Paragraph section(String title) {
        Paragraph heading = new Paragraph(title, SECTION_FONT);
        heading.setSpacingBefore(12f);
        heading.setSpacingAfter(6f);
        return heading;
    }

    private PdfPCell cell(String value, int style) {
        return new PdfPCell(new Paragraph(value, new Font(Font.HELVETICA, 10, style)));
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "Not recorded" : value;
    }
}
