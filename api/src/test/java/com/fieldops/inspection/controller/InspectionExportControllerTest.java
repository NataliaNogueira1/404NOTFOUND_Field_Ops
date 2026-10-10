package com.fieldops.inspection.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.service.InspectionExportService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class InspectionExportControllerTest {

    @Mock
    private InspectionExportService inspectionExportService;

    @InjectMocks
    private InspectionExportController controller;

    @Test
    void returnsCsvAsUtf8DownloadWithFilters() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        String csv = "\uFEFFid,title\r\n";
        when(inspectionExportService.export(InspectionStatus.APPROVED, from, to, 5L)).thenReturn(csv);

        ResponseEntity<String> response = controller.export(InspectionStatus.APPROVED, from, to, 5L);

        assertThat(response.getBody()).isEqualTo(csv);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("text/csv;charset=UTF-8");
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=\"inspections.csv\"");
        verify(inspectionExportService).export(InspectionStatus.APPROVED, from, to, 5L);
    }
}
