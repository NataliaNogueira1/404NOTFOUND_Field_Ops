package com.fieldops.inspection.controller;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.service.InspectionExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspection exports")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAuthority('ADMINISTRATOR')")
public class InspectionExportController {

    private static final MediaType CSV_UTF8 = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final InspectionExportService inspectionExportService;

    public InspectionExportController(InspectionExportService inspectionExportService) {
        this.inspectionExportService = inspectionExportService;
    }

    @Operation(summary = "Export filtered inspections as CSV")
    @ApiResponse(responseCode = "200", description = "UTF-8 CSV download, including a BOM for Excel")
    @ApiResponse(responseCode = "403", description = "Administrator role required")
    @GetMapping(value = "/export.csv", produces = "text/csv")
    public ResponseEntity<String> export(@RequestParam(required = false) InspectionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long clientId) {
        String csv = inspectionExportService.export(status, from, to, clientId);
        return ResponseEntity.ok()
                .contentType(CSV_UTF8)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition())
                .body(csv);
    }

    private String contentDisposition() {
        return ContentDisposition.attachment().filename("inspections.csv").build().toString();
    }
}
