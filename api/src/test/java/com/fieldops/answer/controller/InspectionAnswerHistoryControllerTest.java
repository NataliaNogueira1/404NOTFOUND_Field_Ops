package com.fieldops.answer.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.answer.service.InspectionAnswerHistoryResponse;
import com.fieldops.answer.service.InspectionAnswerHistoryService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class InspectionAnswerHistoryControllerTest {

    @Mock
    private InspectionAnswerHistoryService inspectionAnswerHistoryService;

    @InjectMocks
    private InspectionAnswerHistoryController controller;

    @Test
    void returnsAnswerHistory() {
        List<InspectionAnswerHistoryResponse> history = List.of(new InspectionAnswerHistoryResponse(9L,
                "Electrical safety", "Cables intact?", "PASS", null,
                Instant.parse("2026-09-26T13:00:00Z"), "Alex Technician"));
        when(inspectionAnswerHistoryService.history(12L)).thenReturn(history);

        ResponseEntity<List<InspectionAnswerHistoryResponse>> response = controller.history(12L);

        assertThat(response.getBody()).isEqualTo(history);
        verify(inspectionAnswerHistoryService).history(12L);
    }
}
