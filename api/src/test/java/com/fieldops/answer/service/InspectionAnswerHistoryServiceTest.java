package com.fieldops.answer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fieldops.answer.model.InspectionAnswer;
import com.fieldops.answer.repository.InspectionAnswerRepository;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InspectionAnswerHistoryServiceTest {

    @Mock
    private InspectionRepository inspectionRepository;

    @Mock
    private InspectionAnswerRepository inspectionAnswerRepository;

    @InjectMocks
    private InspectionAnswerHistoryService inspectionAnswerHistoryService;

    @Test
    void returnsRecordedAnswersWithChecklistContext() {
        Inspection inspection = mock(Inspection.class);
        InspectionItemSnapshot snapshot = mock(InspectionItemSnapshot.class);
        User technician = mock(User.class);
        InspectionAnswer answer = mock(InspectionAnswer.class);
        Instant answeredAt = Instant.parse("2026-09-26T13:00:00Z");
        when(inspectionRepository.findById(12L)).thenReturn(Optional.of(inspection));
        when(inspectionAnswerRepository.findHistoryByInspectionId(12L)).thenReturn(List.of(answer));
        when(answer.getItemSnapshot()).thenReturn(snapshot);
        when(answer.getAnsweredBy()).thenReturn(technician);
        when(snapshot.getId()).thenReturn(9L);
        when(snapshot.getSectionTitle()).thenReturn("Electrical safety");
        when(snapshot.getItemTitle()).thenReturn("Cables intact?");
        when(answer.getValue()).thenReturn("PASS");
        when(answer.getObservation()).thenReturn("No damage found");
        when(answer.getAnsweredAt()).thenReturn(answeredAt);
        when(technician.getName()).thenReturn("Alex Technician");

        List<InspectionAnswerHistoryResponse> history = inspectionAnswerHistoryService.history(12L);

        assertThat(history).containsExactly(new InspectionAnswerHistoryResponse(9L,
                "Electrical safety", "Cables intact?", "PASS", "No damage found", answeredAt,
                "Alex Technician"));
    }

    @Test
    void throwsNotFoundWhenInspectionDoesNotExist() {
        when(inspectionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inspectionAnswerHistoryService.history(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Inspection not found: 999");
    }
}
