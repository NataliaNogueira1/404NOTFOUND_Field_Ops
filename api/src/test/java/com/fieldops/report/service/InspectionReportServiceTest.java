package com.fieldops.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.audit.model.InspectionResponseHistory;
import com.fieldops.audit.repository.InspectionResponseHistoryRepository;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.ResponseType;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    private InspectionResponseHistoryRepository responseHistoryRepository;

    @Mock
    private InspectionEvidenceRepository inspectionEvidenceRepository;

    @Mock
    private UserRepository userRepository;

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
    void suppliesLatestAnswersAndEvidenceReferencesToDocument() {
        Inspection inspection = new Inspection();
        InspectionResponseHistory entry = InspectionResponseHistory.of(15L, 7L, "Electrical safety", 1,
                "Grounding verified", 1, ResponseType.TEXT_SHORT, "PASS", "No defect found", 42L,
                Instant.parse("2026-09-26T10:30:00Z"));
        User author = new User();
        org.springframework.test.util.ReflectionTestUtils.setField(author, "id", 42L);
        author.setName("Alex Technician");
        InspectionEvidence evidence = org.mockito.Mockito.mock(InspectionEvidence.class);
        byte[] report = "PDF".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        when(inspectionRepository.findById(15L)).thenReturn(Optional.of(inspection));
        when(nonConformityRepository.findByInspectionIdOrderByCreatedAtAsc(15L)).thenReturn(List.of());
        when(responseHistoryRepository.findLatestAnswersByInspectionId(15L)).thenReturn(List.of(entry));
        when(userRepository.findAllById(List.of(42L))).thenReturn(List.of(author));
        when(inspectionEvidenceRepository.findByInspectionIdOrderByCapturedAtAsc(15L))
                .thenReturn(List.of(evidence));
        ArgumentCaptor<List<ReportAnswer>> answersCaptor = ArgumentCaptor.forClass(List.class);
        when(inspectionReportDocument.generate(org.mockito.ArgumentMatchers.eq(inspection),
                org.mockito.ArgumentMatchers.eq(List.of()), anyList(),
                org.mockito.ArgumentMatchers.eq(List.of(evidence)))).thenReturn(report);

        assertThat(inspectionReportService.generate(15L)).isEqualTo(report);

        verify(inspectionReportDocument).generate(org.mockito.ArgumentMatchers.eq(inspection),
                org.mockito.ArgumentMatchers.eq(List.of()), answersCaptor.capture(),
                org.mockito.ArgumentMatchers.eq(List.of(evidence)));
        ReportAnswer mapped = answersCaptor.getValue().get(0);
        assertThat(mapped.sectionTitle()).isEqualTo("Electrical safety");
        assertThat(mapped.itemTitle()).isEqualTo("Grounding verified");
        assertThat(mapped.value()).isEqualTo("PASS");
        assertThat(mapped.observation()).isEqualTo("No defect found");
        assertThat(mapped.answeredBy()).isEqualTo("Alex Technician");
    }
}
