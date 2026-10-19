package com.fieldops.report.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.report.service.InspectionReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    @Mock
    private InspectionReportService inspectionReportService;

    @InjectMocks
    private ReportController reportController;

    @Test
    void returnsPdfAsDownload() {
        byte[] pdf = "%PDF-1.7".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        when(inspectionReportService.generate(42L)).thenReturn(pdf);

        ResponseEntity<byte[]> response = reportController.download(42L);

        assertThat(response.getBody()).isEqualTo(pdf);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=\"inspection-report-42.pdf\"");
        verify(inspectionReportService).generate(42L);
    }
}
