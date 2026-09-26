package com.fieldops.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.answer.repository.InspectionAnswerRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InspectionReportServiceTest {

    @Mock
    private InspectionRepository inspectionRepository;

    @Mock
    private NonConformityRepository nonConformityRepository;

    @Mock
    private InspectionAnswerRepository inspectionAnswerRepository;

    @Mock
    private InspectionEvidenceRepository inspectionEvidenceRepository;

    @Mock
    private InspectionReportDocument inspectionReportDocument;

    @InjectMocks
    private InspectionReportService inspectionReportService;

    @Test
    void throwsNotFoundWhenInspectionDoesNotExist() {
        when(inspectionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inspectionReportService.generate(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Inspection not found: 999");
    }

    @Test
    void suppliesRecordedAnswersAndEvidenceReferencesToDocument() {
        Inspection inspection = new Inspection();
        InspectionAnswer answer = org.mockito.Mockito.mock(InspectionAnswer.class);
        InspectionEvidence evidence = org.mockito.Mockito.mock(InspectionEvidence.class);
        byte[] report = "PDF".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        when(inspectionRepository.findById(15L)).thenReturn(Optional.of(inspection));
        when(nonConformityRepository.findByInspectionIdOrderByCreatedAtAsc(15L)).thenReturn(List.of());
        when(inspectionAnswerRepository.findHistoryByInspectionId(15L)).thenReturn(List.of(answer));
        when(inspectionEvidenceRepository.findByInspectionIdOrderByCapturedAtAsc(15L))
                .thenReturn(List.of(evidence));
        when(inspectionReportDocument.generate(inspection, List.of(), List.of(answer), List.of(evidence)))
                .thenReturn(report);

        assertThat(inspectionReportService.generate(15L)).isEqualTo(report);

        verify(inspectionReportDocument).generate(inspection, List.of(), List.of(answer), List.of(evidence));
    }
}
