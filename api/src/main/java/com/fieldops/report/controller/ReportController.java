package com.fieldops.report.controller;

import com.fieldops.report.service.InspectionReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Reports")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class ReportController {

    private final InspectionReportService inspectionReportService;

    public ReportController(InspectionReportService inspectionReportService) {
        this.inspectionReportService = inspectionReportService;
    }

    @Operation(summary = "Download an inspection report as PDF")
    @ApiResponse(responseCode = "200", description = "PDF report generated from recorded inspection data")
    @ApiResponse(responseCode = "404", description = "Inspection not found")
    @GetMapping(value = "/{id}/report.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        byte[] report = inspectionReportService.generate(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(id))
                .body(report);
    }

    private String contentDisposition(Long inspectionId) {
        return ContentDisposition.attachment()
                .filename("inspection-report-" + inspectionId + ".pdf")
                .build()
                .toString();
    }
}
