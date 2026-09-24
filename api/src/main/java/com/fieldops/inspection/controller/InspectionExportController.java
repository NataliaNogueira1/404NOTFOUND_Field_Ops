package com.fieldops.inspection.controller;

import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.service.InspectionExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Provides a CSV export of the inspection list, respecting the same filters
 * available in the admin listing. Access is restricted to ADMINISTRATOR only,
 * as the spec requires (exportação de dados é operação sensível).
 *
 * <p>Route: {@code GET /api/v1/inspections/export.csv}</p>
 */
@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspections")
@SecurityRequirement(name = "bearer-jwt")
public class InspectionExportController {

    private static final DateTimeFormatter FILENAME_FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    private final InspectionExportService exportService;

    public InspectionExportController(InspectionExportService exportService) {
        this.exportService = exportService;
    }

    @Operation(
            summary = "Export inspections as CSV",
            description = "Returns a UTF-8 BOM CSV file with the inspection list, "
                    + "respecting the optional filters (status, period, clientName). "
                    + "An empty result set produces a file with only the header row. "
                    + "Restricted to ADMINISTRATOR role.")
    @ApiResponse(responseCode = "200", description = "CSV file returned")
    @ApiResponse(responseCode = "403", description = "Access denied — only ADMINISTRATOR may export")
    @GetMapping(value = "/export.csv", produces = "text/csv;charset=UTF-8")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) InspectionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String clientName) {

        byte[] csv = exportService.export(status, from, to, clientName);

        String filename = "inspections-" + LocalDate.now().format(FILENAME_FMT) + ".csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(csv);
    }
}
